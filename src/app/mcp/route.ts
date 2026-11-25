import { serveMcp } from "@/lib/mcp/route"

// Bundel's MCP server for a whole account. See docs/mcp-plan.md.
const handle = (request: Request) => serveMcp(request, null)

export { handle as GET, handle as POST, handle as DELETE, handle as OPTIONS }
