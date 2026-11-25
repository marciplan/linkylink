import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { fetchPublicText } from "@/lib/net"
import { SCOPES, canonicalResource } from "./urls"

// Bundel's own OAuth 2.1 authorization server for AI apps. Public clients
// only (no client secrets), PKCE S256 required, opaque tokens stored as
// SHA-256 hashes. See docs/mcp-plan.md, "Sign-in and scoping".

export const ACCESS_TOKEN_TTL_S = 60 * 60
const CODE_TTL_MS = 60 * 1000
const CIMD_TTL_MS = 5 * 60 * 1000
const CIMD_MAX_BYTES = 64 * 1024

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function randomToken(prefix: string) {
  return `${prefix}_${randomBytes(32).toString("base64url")}`
}

// --- Clients -----------------------------------------------------------------

export interface ResolvedClient {
  clientId: string
  name: string
  redirectUris: string[]
  kind: "metadata-document" | "registered"
}

const cimdCache = new Map<string, { client: ResolvedClient; until: number }>()

/** A client is either an HTTPS URL to its metadata document (CIMD) or a client we registered. */
export async function resolveClient(clientId: string): Promise<ResolvedClient | null> {
  if (!clientId || clientId.length > 2048) return null
  if (clientId.startsWith("https://")) return resolveMetadataDocument(clientId)
  const row = await prisma.mcpClient.findUnique({ where: { id: clientId } })
  return row ? { clientId: row.id, name: row.name, redirectUris: row.redirectUris, kind: "registered" } : null
}

async function resolveMetadataDocument(clientId: string): Promise<ResolvedClient | null> {
  const cached = cimdCache.get(clientId)
  if (cached && cached.until > Date.now()) return cached.client
  const url = new URL(clientId)
  // The spec requires a path. fetchPublicText refuses our own network, also at connect time.
  if (url.pathname === "/" || url.hash) return null
  const text = await fetchPublicText(url, { maxBytes: CIMD_MAX_BYTES })
  if (!text) return null
  let doc: Record<string, unknown>
  try {
    doc = JSON.parse(text)
  } catch {
    return null
  }
  if (doc.client_id !== clientId || !Array.isArray(doc.redirect_uris)) return null
  const redirectUris = doc.redirect_uris.filter((u): u is string => typeof u === "string" && isAllowedRedirectUri(u))
  if (redirectUris.length === 0) return null
  const name = typeof doc.client_name === "string" && doc.client_name.trim() ? doc.client_name.trim().slice(0, 80) : url.hostname
  const client: ResolvedClient = { clientId, name, redirectUris, kind: "metadata-document" }
  cimdCache.set(clientId, { client, until: Date.now() + CIMD_TTL_MS })
  return client
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"])

/** https anywhere, http only on loopback, or an app's own scheme. Never script-ish schemes. */
export function isAllowedRedirectUri(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.hash) return false
  const scheme = url.protocol.replace(":", "").toLowerCase()
  if (["javascript", "data", "file", "vbscript", "blob", "about"].includes(scheme)) return false
  if (scheme === "http") return LOOPBACK.has(url.hostname)
  return true
}

/** Exact match, except loopback redirects may use any port (RFC 8252 §7.3). */
export function redirectUriMatches(registered: string[], requested: string): boolean {
  if (registered.includes(requested)) return true
  let req: URL
  try {
    req = new URL(requested)
  } catch {
    return false
  }
  if (req.protocol !== "http:" || !LOOPBACK.has(req.hostname)) return false
  return registered.some((r) => {
    try {
      const reg = new URL(r)
      return reg.protocol === "http:" && reg.hostname === req.hostname && reg.pathname === req.pathname && reg.search === req.search
    } catch {
      return false
    }
  })
}

/** Where a redirect goes, for the consent screen: the host of a web redirect, or "scheme://" for an app. */
export function redirectHost(redirectUri: string): string {
  try {
    const url = new URL(redirectUri)
    return url.protocol === "https:" || url.protocol === "http:" ? url.host : `${url.protocol}//`
  } catch {
    return redirectUri
  }
}

// --- Scopes ------------------------------------------------------------------

/**
 * The scopes to grant: all of ours when none are asked for, otherwise the ones
 * we know. Null when only unknown scopes were asked for, so an app never gets
 * write access it did not ask for.
 */
export function normalizeScopes(requested: string | null | undefined): string | null {
  const asked = (requested ?? "").split(/\s+/).filter(Boolean)
  if (asked.length === 0) return SCOPES.join(" ")
  const known = asked.filter((s) => (SCOPES as readonly string[]).includes(s))
  return known.length > 0 ? known.join(" ") : null
}

// --- Authorization codes -------------------------------------------------------

export async function issueAuthCode(data: {
  userId: string
  bundelId: string | null
  client: ResolvedClient
  redirectUri: string
  codeChallenge: string
  resource: string
  scopes: string
}) {
  const code = randomToken("bdl_code")
  await prisma.mcpAuthCode.create({
    data: {
      codeHash: sha256(code),
      userId: data.userId,
      bundelId: data.bundelId,
      clientId: data.client.clientId,
      clientName: data.client.name,
      redirectUri: data.redirectUri,
      codeChallenge: data.codeChallenge,
      resource: data.resource,
      scopes: data.scopes,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  })
  return code
}

function pkceMatches(verifier: string, challenge: string) {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false
  const computed = Buffer.from(createHash("sha256").update(verifier).digest("base64url"))
  const expected = Buffer.from(challenge)
  return computed.length === expected.length && timingSafeEqual(computed, expected)
}

export class OAuthFailure extends Error {
  constructor(public code: string, message: string) {
    super(message)
  }
}

export interface TokenSet {
  access_token: string
  token_type: "Bearer"
  expires_in: number
  refresh_token: string
  scope: string
}

function newTokens() {
  const access = randomToken("bdl_at")
  const refresh = randomToken("bdl_rt")
  return {
    access,
    refresh,
    fields: {
      accessTokenHash: sha256(access),
      accessExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_S * 1000),
      refreshTokenHash: sha256(refresh),
    },
  }
}

export async function exchangeAuthCode(input: {
  code: string
  clientId: string
  redirectUri: string
  codeVerifier: string
  resource: string | null
}): Promise<TokenSet> {
  const codeHash = sha256(input.code)
  const row = await prisma.mcpAuthCode.findUnique({ where: { codeHash } })
  if (!row || row.expiresAt < new Date()) throw new OAuthFailure("invalid_grant", "The code is unknown or expired.")
  // Single use, enforced in the database so two racing requests cannot both win.
  const claimed = await prisma.mcpAuthCode.updateMany({ where: { codeHash, usedAt: null }, data: { usedAt: new Date() } })
  if (claimed.count !== 1) {
    // A replayed code may mean it leaked: drop the grant issued from it, which
    // is the one for the same client and URL made right after the first use.
    const usedAt = (await prisma.mcpAuthCode.findUnique({ where: { codeHash }, select: { usedAt: true } }))?.usedAt
    if (usedAt) {
      await prisma.mcpGrant.updateMany({
        where: {
          userId: row.userId,
          clientId: row.clientId,
          resource: row.resource,
          createdAt: { gte: usedAt, lte: new Date(usedAt.getTime() + 30_000) },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      })
    }
    throw new OAuthFailure("invalid_grant", "The code was already used.")
  }
  if (row.clientId !== input.clientId) throw new OAuthFailure("invalid_grant", "The code was issued to another client.")
  if (row.redirectUri !== input.redirectUri) throw new OAuthFailure("invalid_grant", "redirect_uri does not match.")
  if (input.resource && canonicalResource(input.resource) !== row.resource) throw new OAuthFailure("invalid_target", "resource does not match.")
  if (!pkceMatches(input.codeVerifier, row.codeChallenge)) throw new OAuthFailure("invalid_grant", "PKCE verification failed.")

  const tokens = newTokens()
  await prisma.mcpGrant.create({
    data: {
      userId: row.userId,
      bundelId: row.bundelId,
      clientId: row.clientId,
      clientName: row.clientName,
      redirectHost: redirectHost(row.redirectUri),
      scopes: row.scopes,
      resource: row.resource,
      ...tokens.fields,
    },
  })
  await prisma.mcpAuthCode.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } } }).catch(() => {})
  return { access_token: tokens.access, token_type: "Bearer", expires_in: ACCESS_TOKEN_TTL_S, refresh_token: tokens.refresh, scope: row.scopes }
}

export async function refreshGrant(input: { refreshToken: string; clientId: string; resource: string | null; scope: string | null }): Promise<TokenSet> {
  const hash = sha256(input.refreshToken)
  const grant = await prisma.mcpGrant.findUnique({ where: { refreshTokenHash: hash } })
  if (!grant) {
    // An old refresh token coming back means someone else has a copy: end the grant.
    const reused = await prisma.mcpGrant.findUnique({ where: { prevRefreshTokenHash: hash } })
    if (reused) await prisma.mcpGrant.update({ where: { id: reused.id }, data: { revokedAt: new Date() } })
    throw new OAuthFailure("invalid_grant", "The refresh token is unknown.")
  }
  if (grant.revokedAt) throw new OAuthFailure("invalid_grant", "This connection was revoked.")
  if (grant.clientId !== input.clientId) throw new OAuthFailure("invalid_grant", "The refresh token belongs to another client.")
  if (input.resource && canonicalResource(input.resource) !== grant.resource) throw new OAuthFailure("invalid_target", "resource does not match.")

  // A refresh can never add scopes. The grant keeps what the user approved.
  const scopes = grant.scopes
  if (input.scope) {
    const granted = grant.scopes.split(" ")
    if (input.scope.split(/\s+/).filter(Boolean).some((s) => !granted.includes(s))) {
      throw new OAuthFailure("invalid_scope", "Cannot add scopes on refresh.")
    }
  }

  const tokens = newTokens()
  const updated = await prisma.mcpGrant.updateMany({
    where: { id: grant.id, refreshTokenHash: hash, revokedAt: null },
    data: { ...tokens.fields, prevRefreshTokenHash: hash },
  })
  if (updated.count !== 1) throw new OAuthFailure("invalid_grant", "The refresh token was already used.")
  return { access_token: tokens.access, token_type: "Bearer", expires_in: ACCESS_TOKEN_TTL_S, refresh_token: tokens.refresh, scope: scopes }
}

/** Revokes the grant a token belongs to (RFC 7009: unknown tokens are not an error). */
export async function revokeToken(token: string) {
  const hash = sha256(token)
  await prisma.mcpGrant.updateMany({
    where: { OR: [{ accessTokenHash: hash }, { refreshTokenHash: hash }], revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

// --- Access tokens -------------------------------------------------------------

export interface GrantInfo {
  grantId: string
  userId: string
  bundelId: string | null
  clientId: string
  clientName: string
  scopes: string[]
  resource: string
  expiresAt: number
}

export async function verifyAccessToken(token: string): Promise<GrantInfo | null> {
  if (!token.startsWith("bdl_at_")) return null
  const grant = await prisma.mcpGrant.findUnique({ where: { accessTokenHash: sha256(token) } })
  if (!grant || grant.revokedAt || !grant.accessExpiresAt || grant.accessExpiresAt < new Date()) return null
  if (!grant.lastUsedAt || Date.now() - grant.lastUsedAt.getTime() > 5 * 60 * 1000) {
    prisma.mcpGrant.update({ where: { id: grant.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
  }
  return {
    grantId: grant.id,
    userId: grant.userId,
    bundelId: grant.bundelId,
    clientId: grant.clientId,
    clientName: grant.clientName,
    scopes: grant.scopes.split(" "),
    resource: grant.resource,
    expiresAt: Math.floor(grant.accessExpiresAt.getTime() / 1000),
  }
}

// --- Daily limit -----------------------------------------------------------------

export const DAILY_CALL_LIMIT = 200

/** Counts one tool call against the grant. False when today's limit is used up. */
export async function countCall(grantId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10)
  // Reset on a new day, then increment only while under the limit; both atomic.
  await prisma.mcpGrant.updateMany({ where: { id: grantId, OR: [{ callsDay: null }, { callsDay: { not: today } }] }, data: { callsDay: today, callsCount: 0 } })
  const res = await prisma.mcpGrant.updateMany({
    where: { id: grantId, callsDay: today, callsCount: { lt: DAILY_CALL_LIMIT } },
    data: { callsCount: { increment: 1 } },
  })
  return res.count === 1
}
