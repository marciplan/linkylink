import { prisma } from "@/lib/prisma"
import { isAllowedRedirectUri } from "@/lib/mcp/oauth"
import { CORS_HEADERS, json, oauthError } from "@/lib/mcp/urls"
import { rateLimitHeaders } from "@/lib/rate-limit"

// Dynamic Client Registration (RFC 7591), kept for AI apps that do not use
// Client ID Metadata Documents yet. Public clients only: no secrets issued.
export async function POST(request: Request) {
  const rl = rateLimitHeaders(request, "oauth-register", 10, 60_000)
  if (!rl.allowed) return json(rl.body, { status: 429, headers: rl.headers })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return oauthError("invalid_client_metadata", "Send the client metadata as JSON.")

  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : []
  if (redirectUris.length === 0 || redirectUris.length > 10) {
    return oauthError("invalid_redirect_uri", "Send between 1 and 10 redirect_uris.")
  }
  const bad = redirectUris.find((u) => !isAllowedRedirectUri(u) || u.length > 2048)
  if (bad) return oauthError("invalid_redirect_uri", `Not an allowed redirect URI: ${bad.slice(0, 200)}`)

  const grantTypes = Array.isArray(body.grant_types) ? body.grant_types : ["authorization_code", "refresh_token"]
  if (grantTypes.some((g) => g !== "authorization_code" && g !== "refresh_token")) {
    return oauthError("invalid_client_metadata", "Only authorization_code and refresh_token are supported.")
  }

  const name = typeof body.client_name === "string" && body.client_name.trim() ? body.client_name.trim().slice(0, 80) : "AI app"
  const client = await prisma.mcpClient.create({ data: { name, redirectUris } })

  return json(
    {
      client_id: client.id,
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      client_name: name,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201 }
  )
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
