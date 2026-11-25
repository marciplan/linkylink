import { prisma } from "@/lib/prisma"
import { normalizeScopes, redirectHost, redirectUriMatches, resolveClient, type ResolvedClient } from "./oauth"
import { accountResource, bundelResource, parseResource } from "./urls"

// Validates an /oauth/authorize request. Shared by the consent page (to show
// it) and the approve action (to act on it), so both check the same things.

export type AuthorizeParams = Record<string, string | undefined>

export type AuthorizeCheck =
  /** Show the user an error; never redirect to an unverified redirect_uri. */
  | { kind: "fatal"; message: string }
  /** The client and redirect_uri are known good: report this error back to the app. */
  | { kind: "redirect-error"; redirectUri: string; error: string; description: string; state?: string }
  | {
      kind: "ok"
      client: ResolvedClient
      redirectUri: string
      redirectHost: string
      codeChallenge: string
      state?: string
      scopes: string
      resource: string
      bundel: { id: string; title: string } | null
    }

export async function checkAuthorizeRequest(params: AuthorizeParams, origin: string, userId: string | null): Promise<AuthorizeCheck> {
  const clientId = params.client_id
  const redirectUri = params.redirect_uri
  if (!clientId) return { kind: "fatal", message: "The app did not say who it is (client_id is missing)." }
  const client = await resolveClient(clientId)
  if (!client) return { kind: "fatal", message: "Bundel doesn't recognise this app. Try connecting again from the app." }
  if (!redirectUri || !redirectUriMatches(client.redirectUris, redirectUri)) {
    return { kind: "fatal", message: "The app asked to send you somewhere it didn't register. Nothing was shared." }
  }

  const state = params.state
  const fail = (error: string, description: string): AuthorizeCheck => ({ kind: "redirect-error", redirectUri, error, description, state })

  if (params.response_type !== "code") return fail("unsupported_response_type", "Only response_type=code is supported.")
  if (!params.code_challenge || params.code_challenge_method !== "S256") {
    return fail("invalid_request", "PKCE with code_challenge_method=S256 is required.")
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(params.code_challenge)) return fail("invalid_request", "code_challenge is malformed.")

  // Apps that leave out `resource` get the whole-account connection, and the
  // consent screen says so.
  const target = parseResource(origin, params.resource || accountResource(origin))
  if (!target) return fail("invalid_target", "resource is not a Bundel MCP URL on this server.")
  // Store the canonical spelling: the MCP route compares it as a string on every call.
  const resource = target.bundelId ? bundelResource(origin, target.bundelId) : accountResource(origin)

  const scopes = normalizeScopes(params.scope)
  if (!scopes) return fail("invalid_scope", "Bundel only knows the scopes bundel:read and bundel:write.")

  let bundel: { id: string; title: string } | null = null
  if (target.bundelId && userId) {
    bundel = await prisma.linkLink.findFirst({ where: { id: target.bundelId, userId }, select: { id: true, title: true } })
    if (!bundel) return { kind: "fatal", message: "That Bundel isn't in your account. Sign in with the account that owns it." }
  }

  return {
    kind: "ok",
    client,
    redirectUri,
    redirectHost: redirectHost(redirectUri),
    codeChallenge: params.code_challenge,
    state,
    scopes,
    resource,
    bundel,
  }
}

export function buildRedirect(redirectUri: string, values: Record<string, string | undefined>) {
  const url = new URL(redirectUri)
  for (const [key, value] of Object.entries(values)) if (value !== undefined) url.searchParams.set(key, value)
  return url.toString()
}
