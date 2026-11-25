import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "./oauth"
import { mcpHandler, type McpAccess } from "./server"
import { CORS_HEADERS, accountResource, bundelResource, protectedResourceMetadataUrl, publicOrigin } from "./urls"

// HTTP entry for both MCP URLs. Checks the bearer token on every request:
// issued by us, unexpired, unrevoked, for this exact URL (or the whole
// account), and the Bundel in the URL belongs to the token's user. Auth is
// bearer-only (no cookies), so a browser page on another origin gains nothing
// by calling this; CORS is open for browser-based MCP clients.

function challenge(resource: string, status: 401 | 403, error?: string, description?: string) {
  const parts = [`resource_metadata="${protectedResourceMetadataUrl(resource)}"`]
  if (error) parts.unshift(`error="${error}"`)
  if (description) parts.push(`error_description="${description}"`)
  return new Response(JSON.stringify({ error: error ?? "unauthorized", error_description: description ?? "Connect Bundel to continue." }), {
    status,
    headers: { "Content-Type": "application/json", "WWW-Authenticate": `Bearer ${parts.join(", ")}`, ...CORS_HEADERS },
  })
}

async function logRequest(request: Request, resource: string) {
  if (request.method !== "POST") return
  try {
    const body = await request.clone().json()
    const message = Array.isArray(body) ? body[0] : body
    const meta = message?.params?._meta ?? {}
    const client = message?.method === "initialize" ? message?.params?.clientInfo : meta["io.modelcontextprotocol/clientInfo"]
    console.log(
      "[mcp]",
      JSON.stringify({
        resource,
        method: message?.method ?? null,
        tool: message?.method === "tools/call" ? message?.params?.name : undefined,
        protocol: request.headers.get("mcp-protocol-version") ?? message?.params?.protocolVersion ?? null,
        client: client?.name ?? request.headers.get("user-agent"),
      })
    )
  } catch {
    // Unreadable bodies are answered by the handler.
  }
}

export async function serveMcp(request: Request, bundelId: string | null): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS })

  const origin = publicOrigin(request)
  const resource = bundelId ? bundelResource(origin, bundelId) : accountResource(origin)
  await logRequest(request, resource)

  const header = request.headers.get("authorization")
  if (!header?.toLowerCase().startsWith("bearer ")) return challenge(resource, 401)
  const token = header.slice(7).trim()
  const grant = await verifyAccessToken(token)
  if (!grant) return challenge(resource, 401, "invalid_token", "The token is unknown, expired or revoked.")

  // A per-Bundel token works only at its own URL. A whole-account token works everywhere in that account.
  const fitsUrl = grant.resource === resource || (grant.bundelId === null && grant.resource === accountResource(origin))
  if (!fitsUrl) return challenge(resource, 401, "invalid_token", "The token was issued for a different Bundel URL.")

  if (bundelId) {
    const owned = await prisma.linkLink.findFirst({ where: { id: bundelId, userId: grant.userId }, select: { id: true } })
    if (!owned) return challenge(resource, 403, "insufficient_scope", "This Bundel is not in the connected account.")
  }

  const access: McpAccess = {
    userId: grant.userId,
    grantId: grant.grantId,
    scopes: grant.scopes,
    rootBundelId: bundelId,
    origin,
  }
  const response = await mcpHandler.fetch(request, {
    authInfo: {
      token,
      clientId: grant.clientId,
      scopes: grant.scopes,
      expiresAt: grant.expiresAt,
      resource: new URL(resource),
      extra: { access },
    },
  })
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
