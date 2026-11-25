import { serveMcp } from "@/lib/mcp/route"

// Bundel's MCP server for one Bundel and the sub-Bundels under it.
async function handle(request: Request, ctx: RouteContext<"/mcp/b/[id]">) {
  const { id } = await ctx.params
  return serveMcp(request, id)
}

export { handle as GET, handle as POST, handle as DELETE, handle as OPTIONS }
