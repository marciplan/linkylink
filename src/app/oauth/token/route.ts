import { OAuthFailure, exchangeAuthCode, refreshGrant } from "@/lib/mcp/oauth"
import { CORS_HEADERS, json, oauthError } from "@/lib/mcp/urls"
import { rateLimitHeaders } from "@/lib/rate-limit"

// OAuth token endpoint for AI apps: authorization_code (with PKCE) and refresh_token.

async function readParams(request: Request): Promise<URLSearchParams> {
  const type = request.headers.get("content-type") ?? ""
  if (type.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    return new URLSearchParams(Object.entries(body).filter(([, v]) => typeof v === "string") as [string, string][])
  }
  return new URLSearchParams(await request.text())
}

/** Public clients send client_id in the body; tolerate Basic auth with an empty secret too. */
function clientIdFrom(request: Request, params: URLSearchParams) {
  const fromBody = params.get("client_id")
  if (fromBody) return fromBody
  const header = request.headers.get("authorization")
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString()
    return decodeURIComponent(decoded.split(":")[0] ?? "")
  }
  return ""
}

export async function POST(request: Request) {
  const rl = rateLimitHeaders(request, "oauth-token", 60, 60_000)
  if (!rl.allowed) return json(rl.body, { status: 429, headers: rl.headers })

  const params = await readParams(request)
  const grantType = params.get("grant_type")
  const clientId = clientIdFrom(request, params)
  if (!clientId) return oauthError("invalid_client", "client_id is required.", 401)

  try {
    if (grantType === "authorization_code") {
      const code = params.get("code")
      const redirectUri = params.get("redirect_uri")
      const codeVerifier = params.get("code_verifier")
      if (!code || !redirectUri || !codeVerifier) {
        return oauthError("invalid_request", "code, redirect_uri and code_verifier are required.")
      }
      return json(await exchangeAuthCode({ code, clientId, redirectUri, codeVerifier, resource: params.get("resource") }))
    }
    if (grantType === "refresh_token") {
      const refreshToken = params.get("refresh_token")
      if (!refreshToken) return oauthError("invalid_request", "refresh_token is required.")
      return json(await refreshGrant({ refreshToken, clientId, resource: params.get("resource"), scope: params.get("scope") }))
    }
    return oauthError("unsupported_grant_type", "Use authorization_code or refresh_token.")
  } catch (error) {
    if (error instanceof OAuthFailure) return oauthError(error.code, error.message)
    console.error("[oauth/token]", error)
    return oauthError("server_error", "Something went wrong.", 500)
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
