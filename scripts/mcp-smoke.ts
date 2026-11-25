/**
 * End-to-end check of the Bundel MCP server: OAuth (registration, codes,
 * PKCE, refresh rotation, revocation), scoping, and every tool.
 *
 * DEV DATABASES ONLY: it creates a throwaway user and Bundels directly in
 * the database DATABASE_URL points at, and skips the consent screen by
 * issuing the code itself (test the consent screen in a browser).
 *
 *   DATABASE_URL=<dev db> npx tsx scripts/mcp-smoke.ts http://localhost:3101
 */
import { createHash, randomBytes } from "node:crypto"
import { PrismaClient } from "@prisma/client"
import { issueAuthCode, resolveClient } from "../src/lib/mcp/oauth"
import { checkAuthorizeRequest } from "../src/lib/mcp/authorize"
import { fill } from "../src/lib/mcp/activities"

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "")
const prisma = new PrismaClient()

let failures = 0
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail !== undefined ? `  -> ${JSON.stringify(detail).slice(0, 400)}` : ""}`)
  if (!ok) failures++
}

const b64url = (buf: Buffer) => buf.toString("base64url")
function pkce() {
  const verifier = b64url(randomBytes(32))
  return { verifier, challenge: b64url(createHash("sha256").update(verifier).digest()) }
}

async function token(params: Record<string, string>) {
  const res = await fetch(`${BASE}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) })
  return { status: res.status, body: (await res.json()) as Record<string, string> }
}

let rpcId = 1
/** One stateless 2025-era JSON-RPC call; answers may come as JSON or one SSE event. */
async function rpc(path: string, accessToken: string | null, method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-11-25",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
  })
  const text = await res.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose JSON-RPC test responses
  let body: any = null
  try {
    body = res.headers.get("content-type")?.includes("text/event-stream")
      ? JSON.parse(text.split("\n").find((l) => l.startsWith("data:"))!.slice(5))
      : JSON.parse(text)
  } catch {
    body = text
  }
  return { status: res.status, headers: res.headers, body }
}

async function call(path: string, accessToken: string, name: string, args: Record<string, unknown> = {}) {
  const r = await rpc(path, accessToken, "tools/call", { name, arguments: args })
  const result = r.body?.result
  return { status: r.status, isError: !!result?.isError, data: result?.structuredContent, text: result?.content?.[0]?.text as string | undefined }
}

async function connect(clientId: string, redirectUri: string, userId: string, resource: string, bundelId: string | null) {
  const client = await resolveClient(clientId)
  if (!client) throw new Error("client did not resolve")
  const { verifier, challenge } = pkce()
  const code = await issueAuthCode({ userId, bundelId, client, redirectUri, codeChallenge: challenge, resource, scopes: "bundel:read bundel:write" })
  return token({ grant_type: "authorization_code", code, client_id: clientId, redirect_uri: redirectUri, code_verifier: verifier, resource })
}

async function main() {
  const tag = randomBytes(4).toString("hex")
  const dollar = "Shoes $$ sale $& now $'"
  check("A $ in a title survives filling a template", fill("Deals: {{title}}", { link: "", title: dollar }) === `Deals: ${dollar}`)
  const user = await prisma.user.create({ data: { email: `smoke-${tag}@example.test`, username: `smoke-${tag}`, password: "x" } })
  const other = await prisma.user.create({ data: { email: `other-${tag}@example.test`, username: `other-${tag}`, password: "x" } })
  const bundelA = await prisma.linkLink.create({
    data: { userId: user.id, title: "Black Friday", slug: `bf-${tag}`, links: { create: [{ title: "Sony WH-1000XM6", url: "https://www.sony.com/headphones/wh-1000xm6", order: 0 }] } },
    include: { links: true },
  })
  const bundelB = await prisma.linkLink.create({ data: { userId: user.id, title: "Other list", slug: `other-${tag}` } })
  const foreign = await prisma.linkLink.create({ data: { userId: other.id, title: "Not yours", slug: `foreign-${tag}` } })
  const sony = bundelA.links[0]
  await prisma.blockedSite.create({ data: { userId: user.id, domain: "amazon.com" } })

  const resA = `${BASE}/mcp/b/${bundelA.id}`
  const resAccount = `${BASE}/mcp`

  // Discovery
  const as = await (await fetch(`${BASE}/.well-known/oauth-authorization-server`)).json()
  check("AS metadata advertises CIMD, PKCE S256 and registration", as.client_id_metadata_document_supported === true && as.code_challenge_methods_supported?.includes("S256") && !!as.registration_endpoint, as)
  const prm = await (await fetch(`${BASE}/.well-known/oauth-protected-resource/mcp/b/${bundelA.id}`)).json()
  check("PRM names the per-Bundel resource", prm.resource === resA && prm.authorization_servers?.[0] === BASE, prm)
  const unauthed = await rpc(`/mcp/b/${bundelA.id}`, null, "tools/list")
  check("No token: 401 with resource_metadata", unauthed.status === 401 && (unauthed.headers.get("www-authenticate") ?? "").includes(`resource_metadata="${BASE}/.well-known/oauth-protected-resource/mcp/b/${bundelA.id}"`), unauthed.headers.get("www-authenticate"))

  // Registration
  const redirectUri = "http://127.0.0.1:43123/callback"
  const reg = await fetch(`${BASE}/oauth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: "Smoke test", redirect_uris: [redirectUri] }) })
  const regBody = await reg.json()
  check("DCR registers a public client", reg.status === 201 && !!regBody.client_id && regBody.token_endpoint_auth_method === "none", regBody)
  const badReg = await fetch(`${BASE}/oauth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redirect_uris: ["javascript:alert(1)"] }) })
  check("DCR rejects a javascript: redirect", badReg.status === 400)
  const clientId = regBody.client_id as string

  // Token exchange checks
  {
    const client = (await resolveClient(clientId))!
    const { verifier, challenge } = pkce()
    const code = await issueAuthCode({ userId: user.id, bundelId: bundelA.id, client, redirectUri, codeChallenge: challenge, resource: resA, scopes: "bundel:read bundel:write" })
    const wrong = await token({ grant_type: "authorization_code", code, client_id: clientId, redirect_uri: redirectUri, code_verifier: pkce().verifier, resource: resA })
    check("Wrong PKCE verifier is refused", wrong.status === 400 && wrong.body.error === "invalid_grant", wrong.body)
    const replay = await token({ grant_type: "authorization_code", code, client_id: clientId, redirect_uri: redirectUri, code_verifier: verifier, resource: resA })
    check("A code works only once", replay.status === 400, replay.body)
  }

  // Authorize request checks (the consent page and its action share these)
  {
    const { challenge } = pkce()
    const base = { client_id: clientId, redirect_uri: redirectUri, response_type: "code", code_challenge: challenge, code_challenge_method: "S256" }
    const slash = await checkAuthorizeRequest({ ...base, resource: `${resA.replace("localhost", "LOCALHOST")}/` }, BASE, user.id)
    check("A resource with a trailing slash or capitals is stored canonically", slash.kind === "ok" && slash.resource === resA, slash)
    const unknown = await checkAuthorizeRequest({ ...base, resource: resA, scope: "openid profile" }, BASE, user.id)
    check("Only unknown scopes are refused with invalid_scope", unknown.kind === "redirect-error" && unknown.error === "invalid_scope", unknown)
    const readOnly = await checkAuthorizeRequest({ ...base, resource: resA, scope: "bundel:read" }, BASE, user.id)
    check("Asking for read only grants read only", readOnly.kind === "ok" && readOnly.scopes === "bundel:read", readOnly)
    const evilRedirect = await checkAuthorizeRequest({ ...base, redirect_uri: "https://evil.example/cb", resource: resA }, BASE, user.id)
    check("An unregistered redirect_uri is a hard stop, not a redirect", evilRedirect.kind === "fatal", evilRedirect)
  }

  // Per-Bundel connection
  const t = await connect(clientId, redirectUri, user.id, resA, bundelA.id)
  {
    const client = (await resolveClient(clientId))!
    const { verifier, challenge } = pkce()
    const code = await issueAuthCode({ userId: user.id, bundelId: bundelA.id, client, redirectUri, codeChallenge: challenge, resource: resA, scopes: "bundel:read" })
    const ro = await token({ grant_type: "authorization_code", code, client_id: clientId, redirect_uri: redirectUri, code_verifier: verifier, resource: `${resA}/` })
    check("Token exchange accepts the resource with a trailing slash", ro.status === 200, ro.body)
    const roStart = await call(`/mcp/b/${bundelA.id}`, ro.body.access_token, "start_activity", { activity: "find_deals", link_id: sony.id })
    check("A read-only connection cannot start an activity", roStart.isError && (roStart.text ?? "").includes("bundel:write"), roStart)
  }
  check("Code exchange returns access and refresh tokens", t.status === 200 && t.body.access_token?.startsWith("bdl_at_") && !!t.body.refresh_token, t.body)
  const access = t.body.access_token
  const pathA = `/mcp/b/${bundelA.id}`

  const tools = await rpc(pathA, access, "tools/list")
  const names: string[] = tools.body?.result?.tools?.map((x: { name: string }) => x.name) ?? []
  check("Per-Bundel connection lists its tools without create_bundel", names.includes("add_links") && names.includes("save_results") && !names.includes("create_bundel"), names)
  const prompts = await rpc(pathA, access, "prompts/list")
  check("Activities are offered as prompts", (prompts.body?.result?.prompts?.length ?? 0) === 4, prompts.body)

  const list = await call(pathA, access, "list_bundels")
  check("list_bundels shows only this Bundel", list.data?.bundels?.length === 1 && list.data.bundels[0].id === bundelA.id, list)

  const added = await call(pathA, access, "add_links", {
    links: [
      { url: "https://www.lego.com/en-us/product/millennium-falcon-75192" },
      { url: "sony.com/headphones/wh-1000xm6", title: "dup" },
      { url: "not a url" },
    ],
  })
  check("add_links adds new, skips duplicates and bad URLs, suggests activities", added.data?.added?.length === 1 && added.data.skipped_duplicates.length === 1 && added.data.invalid.length === 1 && added.data.next_activities.length === 3, added)
  check("add_links derives a title from the URL", added.data?.added?.[0]?.title === "Millennium Falcon 75192", added.data?.added)

  const intoB = await call(pathA, access, "add_links", { bundel_id: bundelB.id, links: [{ url: "https://example.com" }] })
  check("Per-Bundel token cannot write to another Bundel by id", intoB.isError, intoB)
  const intoForeign = await call(pathA, access, "get_bundel", { bundel_id: foreign.id })
  check("Per-Bundel token cannot read someone else's Bundel", intoForeign.isError, intoForeign)
  const atAccount = await rpc("/mcp", access, "tools/list")
  check("Per-Bundel token is refused at the account URL", atAccount.status === 401, atAccount.status)
  const atB = await rpc(`/mcp/b/${bundelB.id}`, access, "tools/list")
  check("Per-Bundel token is refused at another Bundel's URL", atB.status === 401, atB.status)

  // Activity
  const started = await call(pathA, access, "start_activity", { activity: "find_deals", link_id: sony.id })
  check("start_activity returns a run, instructions and the skip list", !!started.data?.run_id && started.data.skip_sites.includes("amazon.com") && started.data.instructions.includes("amazon.com"), started)
  const saved = await call(pathA, access, "save_results", {
    run_id: started.data?.run_id,
    results: [
      { url: "https://www.coolblue.nl/product/1", title: "Coolblue", note: "€ 349, free shipping" },
      { url: "https://www.bol.com/nl/p/2", title: "Bol", note: "€ 359" },
      { url: "https://smile.amazon.com/dp/3", title: "Amazon", note: "€ 365" },
    ],
  })
  check("save_results makes a sub-Bundel and drops skipped sites", saved.data?.added?.length === 2 && saved.data.dropped_skipped_sites.length === 1, saved)
  const again = await call(pathA, access, "save_results", { run_id: started.data?.run_id, results: [{ url: "https://www.mediamarkt.nl/p/4", title: "MediaMarkt" }] })
  check("A second save adds to the same sub-Bundel", again.data?.sub_bundel?.id === saved.data?.sub_bundel?.id && again.data.added.length === 1, again)
  const sub = await prisma.linkLink.findUnique({ where: { id: saved.data?.sub_bundel?.id }, include: { subBundelOf: true } })
  check("Sub-Bundel is private and hangs under the source link", sub?.isPublic === false && sub.subBundelOf?.sourceLinkId === sony.id && sub.subBundelOf.parentId === bundelA.id, sub)
  const read = await call(pathA, access, "get_bundel")
  check("get_bundel shows the sub-Bundel under its link", read.data?.links?.find((l: { id: string }) => l.id === sony.id)?.sub_bundels?.length === 1, read.data)
  const subRead = await call(pathA, access, "get_bundel", { bundel_id: sub!.id })
  check("Per-Bundel token can read its sub-Bundels", !subRead.isError && subRead.data?.links?.length === 3, subRead)
  const page = await fetch(`${BASE}/${user.username}/${sub!.slug}`)
  check("A logged-out visitor gets 404 on the private sub-Bundel", page.status === 404, page.status)
  const compare = await call(pathA, access, "start_activity", { activity: "compare" })
  check("compare runs on the whole Bundel", !!compare.data?.run_id, compare)
  const foreignRun = await call(pathA, access, "save_results", { run_id: "nope", results: [{ url: "https://example.com" }] })
  check("save_results refuses an unknown run", foreignRun.isError, foreignRun)

  // Refresh rotation and reuse detection
  const refreshed = await token({ grant_type: "refresh_token", refresh_token: t.body.refresh_token, client_id: clientId })
  check("Refresh returns new tokens", refreshed.status === 200 && refreshed.body.access_token !== access, refreshed.body)
  const oldAccess = await rpc(pathA, access, "tools/list")
  check("The old access token stops working after refresh", oldAccess.status === 401, oldAccess.status)
  const newAccess = await rpc(pathA, refreshed.body.access_token, "tools/list")
  check("The new access token works", newAccess.status === 200, newAccess.status)
  const reuse = await token({ grant_type: "refresh_token", refresh_token: t.body.refresh_token, client_id: clientId })
  check("Reusing an old refresh token is refused", reuse.status === 400, reuse.body)
  const afterReuse = await rpc(pathA, refreshed.body.access_token, "tools/list")
  check("Reuse revokes the whole connection", afterReuse.status === 401, afterReuse.status)

  // Account-wide connection
  const acct = await connect(clientId, redirectUri, user.id, resAccount, null)
  const acctTools = await rpc("/mcp", acct.body.access_token, "tools/list")
  check("Account connection has create_bundel", (acctTools.body?.result?.tools ?? []).some((x: { name: string }) => x.name === "create_bundel"), acctTools.body)
  const made = await call("/mcp", acct.body.access_token, "create_bundel", { title: "Lisbon trip", links: [{ url: "https://www.visitlisboa.com" }] })
  check("create_bundel makes a Bundel with links", !!made.data?.bundel?.id && made.data.added.length === 1, made)
  const acctList = await call("/mcp", acct.body.access_token, "list_bundels")
  check("Account list_bundels hides sub-Bundels", !acctList.data?.bundels?.some((b: { id: string }) => b.id === sub!.id) && acctList.data?.bundels?.length === 3, acctList.data)
  const acctAtBundel = await rpc(`/mcp/b/${bundelB.id}`, acct.body.access_token, "tools/list")
  check("Account token also works at one of its Bundel URLs", acctAtBundel.status === 200, acctAtBundel.status)
  const acctAtForeign = await rpc(`/mcp/b/${foreign.id}`, acct.body.access_token, "tools/list")
  check("Account token is refused at someone else's Bundel URL", acctAtForeign.status === 403, acctAtForeign.status)

  // Revocation from Account
  await prisma.mcpGrant.updateMany({ where: { userId: user.id }, data: { revokedAt: new Date() } })
  const revoked = await rpc("/mcp", acct.body.access_token, "tools/list")
  check("A revoked connection gets 401", revoked.status === 401, revoked.status)

  // Daily limit
  const limited = await connect(clientId, redirectUri, user.id, resA, bundelA.id)
  const grant = await prisma.mcpGrant.findUniqueOrThrow({ where: { accessTokenHash: createHash("sha256").update(limited.body.access_token).digest("hex") } })
  await prisma.mcpGrant.update({ where: { id: grant.id }, data: { callsDay: new Date().toISOString().slice(0, 10), callsCount: 200 } })
  const over = await call(pathA, limited.body.access_token, "list_bundels")
  check("Calls over the daily limit are refused", over.isError && (over.text ?? "").includes("200 calls"), over)

  await prisma.user.deleteMany({ where: { id: { in: [user.id, other.id] } } })
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`)
}

main()
  .catch((error) => {
    console.error(error)
    failures++
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(failures === 0 ? 0 : 1)
  })
