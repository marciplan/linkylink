import { revokeToken } from "@/lib/mcp/oauth"
import { CORS_HEADERS } from "@/lib/mcp/urls"

// RFC 7009 token revocation. Always 200, whether or not the token was known.
export async function POST(request: Request) {
  const params = new URLSearchParams(await request.text())
  const token = params.get("token")
  if (token) await revokeToken(token)
  return new Response(null, { status: 200, headers: CORS_HEADERS })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
