import { CORS_HEADERS, accountResource, json, oauthError, parseResource, protectedResourceMetadata, publicOrigin } from "@/lib/mcp/urls"

// RFC 9728 metadata for each MCP URL: /.well-known/oauth-protected-resource/mcp
// and /.well-known/oauth-protected-resource/mcp/b/<bundel id>.
export async function GET(request: Request, ctx: RouteContext<"/.well-known/oauth-protected-resource/[[...path]]">) {
  const origin = publicOrigin(request)
  const { path } = await ctx.params
  const resource = path?.length ? `${origin}/${path.join("/")}` : accountResource(origin)
  if (!parseResource(origin, resource)) return oauthError("not_found", "No such resource.", 404)
  return json(protectedResourceMetadata(origin, resource), { headers: { "Cache-Control": "public, max-age=3600" } })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
