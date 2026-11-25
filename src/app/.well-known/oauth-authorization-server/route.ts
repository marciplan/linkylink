import { CORS_HEADERS, authorizationServerMetadata, json, publicOrigin } from "@/lib/mcp/urls"

// RFC 8414 metadata for Bundel's authorization server, used by AI apps.
export function GET(request: Request) {
  return json(authorizationServerMetadata(publicOrigin(request)), { headers: { "Cache-Control": "public, max-age=3600" } })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
