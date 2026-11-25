// The public URLs of the MCP server and its authorization server. Everything
// is derived from the host the request came in on, so production, previews
// and local tunnels each act as their own issuer.

export const SCOPES = ["bundel:read", "bundel:write"] as const
export type Scope = (typeof SCOPES)[number]

/** The origin the client used, honoring a proxy in front of us (Vercel, Tailscale). */
export function publicOrigin(request: Request): string {
  const url = new URL(request.url)
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host") || url.host
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.replace(":", "")
  return new URL(`${proto}://${host}`).origin
}

/** The same, for server components and actions, which get headers but no Request. */
export function originFromHeaders(h: Headers): string {
  const host = h.get("x-forwarded-host")?.split(",")[0].trim() || h.get("host") || "localhost:3000"
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https")
  return new URL(`${proto}://${host}`).origin
}

export function accountResource(origin: string) {
  return `${origin}/mcp`
}

export function bundelResource(origin: string, bundelId: string) {
  return `${origin}/mcp/b/${bundelId}`
}

/** Reads a resource URL back into its parts. Null when it is not one of ours on this origin. */
export function parseResource(origin: string, resource: string | null | undefined): { bundelId: string | null } | null {
  if (!resource) return null
  let url: URL
  try {
    url = new URL(resource)
  } catch {
    return null
  }
  if (url.origin !== origin || url.search || url.hash) return null
  const path = url.pathname.replace(/\/+$/, "")
  if (path === "/mcp") return { bundelId: null }
  const match = path.match(/^\/mcp\/b\/([A-Za-z0-9_-]{1,64})$/)
  return match ? { bundelId: match[1] } : null
}

/** One spelling per resource (lowercase host, no default port, no trailing slash), so stored and expected values compare as strings. */
export function canonicalResource(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`
  } catch {
    return null
  }
}

/** Where RFC 9728 metadata for a resource lives: /.well-known/oauth-protected-resource + its path. */
export function protectedResourceMetadataUrl(resource: string) {
  const url = new URL(resource)
  return `${url.origin}/.well-known/oauth-protected-resource${url.pathname}`
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    revocation_endpoint: `${origin}/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [...SCOPES],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
    service_documentation: `${origin}/about`,
  }
}

export function protectedResourceMetadata(origin: string, resource: string) {
  return {
    resource,
    authorization_servers: [origin],
    scopes_supported: [...SCOPES],
    bearer_methods_supported: ["header"],
    resource_name: "Bundel",
    resource_documentation: `${origin}/about`,
  }
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name",
  "Access-Control-Expose-Headers": "WWW-Authenticate, MCP-Protocol-Version",
}

export function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return Response.json(body, {
    status: init.status ?? 200,
    headers: { "Cache-Control": "no-store", ...CORS_HEADERS, ...init.headers },
  })
}

export function oauthError(error: string, description: string, status = 400) {
  return json({ error, error_description: description }, { status })
}
