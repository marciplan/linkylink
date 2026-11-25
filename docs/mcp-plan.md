# Bundel MCP: build plan

Written 2026-11-25 as a handoff. You are picking this up in the `linkylink` repo (the product is called Bundel) with no memory of the conversation that produced it, so everything you need is here. Read it once fully before starting; the order of the phases matters.

## What we are building and why

Bundel is a link-list app: a user owns Bundels (table `LinkLink`), each holding links (table `Link`). We are turning Bundel into a remote MCP server so a user can connect their own AI app (Claude, ChatGPT) and:

1. Tell it "add this to my list" and have the link land in a Bundel.
2. Run an activity on a link, such as "Find deals for this". The AI app does the web research, then saves what it found as a **sub-Bundel** hanging under the original link.

The important design choice: Bundel never does the research. The AI app searches on the user's own subscription and Bundel only stores and shows the result. That keeps our AI cost at zero and is why activities are delivered as instructions the AI follows, not as server-side jobs. Use cases the owner has in mind: Black Friday deal hunting, finding hotels for a trip.

Connections are scoped per user and, by default, per Bundel: a connection made from one Bundel can only reach that Bundel and its sub-Bundels.

## Decisions already made

These were settled with the owner. Build to them; do not reopen them.

- Two MCP URLs sharing one implementation: `/mcp/b/<bundelId>` (one Bundel plus its sub-Bundels) and `/mcp` (whole account, can create Bundels). The per-Bundel URL is the headline in the UI; the account-wide one sits in Account.
- Tools are add-only in v1. No edit or delete tools over MCP.
- Sub-Bundels created by an AI start private (`isPublic: false`). The owner can flip them visible later (phase 3).
- A sub-Bundel is a normal `LinkLink` row. A separate table records where it hangs. This is so links, favicons, editing and sharing work on it with no new code.
- In the owner view, a link with results shows a chip ("5 deals found"). Tapping the chip expands the first three results inside the same card, with "N more" and "Open as Bundel". Tapping the link itself still opens the site.
- Each expanded result has a remove control. The same control offers "Never show this site", which adds the domain to the user's skip list.
- "Sites to skip" is a per-user list of domains in Account. It applies to activity results only. A link the user adds themselves from a skipped site still goes in.
- The skip list is enforced twice: the activity instructions tell the AI to avoid those domains, and `save_results` drops any link on them server-side. The second check is the guarantee; the first just saves the AI wasted effort.
- Free for all users through phase 3.
- Schema changes are new tables only, never new columns on existing tables. See "Repo conventions".

## What is not verified yet

The MCP research was done from the spec pages only. These points are unverified, and phase 0 exists to settle them before any real code is written:

- **Which spec revision clients speak.** The latest revision is `2026-07-28`. It removes the `initialize` handshake, `Mcp-Session-Id` and the GET stream, makes every request self-contained (protocol version and capabilities ride in `_meta`), and makes `server/discover` mandatory. Clients in the wild may still speak `2025-06-18` or `2025-11-25`. We need to serve whatever Claude and ChatGPT actually send.
- **Which SDK to use.** On npm today: `@modelcontextprotocol/sdk` is at 1.32.2, there is a separate `@modelcontextprotocol/server` at 2.4.0, and `mcp-handler` 2.4.0 (Vercel's Next.js adapter) peer-depends on `@modelcontextprotocol/server ^2.0.0`. I have not read their docs. Read the installed package docs and pick the one that supports stateless Streamable HTTP in a Next.js route handler and the spec revisions the clients need.
- **Client registration support.** The 2026-07-28 spec prefers Client ID Metadata Documents (CIMD) and deprecates Dynamic Client Registration (DCR). Whether Claude and ChatGPT use CIMD, DCR or both today is unknown, which is why the plan implements both.
- **Prompt support per client.** MCP prompts show as slash commands in some apps and not at all in others. The plan does not depend on them.

Spec pages worth reading first, all under `https://modelcontextprotocol.io`: `/llms.txt` (index), `/specification/2026-07-28/changelog`, and from the index the pages for Streamable HTTP, Authorization, Client registration, Tools, Prompts, and Security best practices.

## Repo facts you will need

- Next.js 16.2.6 App Router, React 19, Prisma 6 on Neon Postgres, NextAuth v5 beta with a Credentials provider and JWT sessions, Tailwind, deployed on Vercel. Node 24.
- Next.js ships version-matched docs in `node_modules/next/dist/docs/`. Read the relevant page there before writing route handlers or using `after()`; do not rely on remembered APIs.
- `prisma/schema.prisma`: `User`, `LinkLink` (the Bundel; has `isPublic`, `slug`, `type`), `Link` (`title`, `url`, `favicon`, `context`, `order`). `Remix` is the pattern to copy for a side table keyed by a `LinkLink` id.
- `src/lib/actions.ts`: server actions. `createLinkylink`, `addLink`, `addLinkToLinkylink`, `deleteLink` all call `auth()` for the session user and check ownership with `where: { id, userId }`.
- `src/lib/auth.ts`, `src/lib/auth-config.ts`, `src/proxy.ts`: NextAuth setup. `proxy.ts` only guards `/dashboard`, `/create`, `/edit`, `/account`, `/recommendations`, `/share`.
- `src/lib/links.ts`: `normalizeUrl`, `domainOf`, `titleFromUrl`. Reuse these.
- `src/lib/optional.ts`: wraps reads of newer tables so a deploy that has not run `prisma db push` degrades to "feature off". Use it for every read of the new tables from existing pages.
- `src/lib/rate-limit.ts`: in-memory, per server instance. Fine for what it does today, not good enough for MCP on serverless.
- `src/app/api/unfurl/route.ts`: has a `PRIVATE_HOST` block against fetching private addresses. `src/app/api/favicon/route.ts` fetches `${origin}/favicon.ico` for any URL with no such block.
- `src/app/[username]/[slug]/page.tsx` and `BundelOwnerView.tsx` (557 lines), `BundelVisitorView.tsx`: the Bundel page. `src/components/bundel/LinkRow.tsx`, `LinkMoreButton.tsx`, `styles.ts`: the link row.
- `src/app/(app)/account/AccountView.tsx`: Account page, where Connected AI apps and Sites to skip go.
- Places that list Bundels and must hide sub-Bundels: `src/app/(app)/dashboard/page.tsx`, `src/app/[username]/page.tsx`, `src/app/directory/page.tsx`, `src/app/api/search-linkylinks/route.ts`, `src/app/share/page.tsx`, `src/app/(app)/recommendations/page.tsx`, `src/app/api/recommendations/apply/route.ts`, `src/lib/rss.ts` and the feed routes, `src/app/api/cron/digest/route.ts`, `src/app/[username]/kobo/`.
- There is no test runner. Verification is `npm run build`, `npm run lint`, and scripted flows.
- `src/app/[username]` is a top-level dynamic route. New static segments `mcp` and `oauth` take precedence over it, so a user named `mcp` or `oauth` would lose their profile. Check how registration validates usernames and reserve both names.

## Repo conventions

- **New tables only.** The sharing features were added as separate tables "so the app keeps working until `prisma db push` has run". Follow that: no new columns or enum values on `User`, `LinkLink`, `Link`. Back-relations on existing models are fine since they add no columns.
- **Schema rollout is `npx prisma db push`**, no migrations folder. `.env.local` has a `DATABASE_URL`; find out whether it points at production before pushing anything, and ask the owner if you cannot tell. Never push a schema to production without the owner saying so.
- Never commit to `main`. Work on a branch, one pull request per phase.
- The owner reads short replies. Lead with the result, keep it to a few lines, put detail in a file.
- Links to anything running locally go out as Tailscale links, not localhost. The dev server for this repo runs on port 3100, served at `https://mac-mini-van-marciano.tail6294de.ts.net:3143`. That address is tailnet-only: the owner can open it, but Claude.ai and ChatGPT cannot reach it. See phase 0 for what that means for testing.

## Phase 0: prove the connection

Goal: learn what clients actually send, before designing around a spec they may not speak yet. Keep this small and throwaway-friendly.

1. Read the SDK docs and pick the package (see "What is not verified yet").
2. Add a stub MCP route at `/mcp` with one tool, `whoami`, returning a fixed string. No auth yet.
3. Test locally with the MCP Inspector (`npx @modelcontextprotocol/inspector`) and with Claude Code (`claude mcp add --transport http`), both of which can reach localhost.
4. Testing from Claude.ai and ChatGPT needs a public HTTPS URL, which means a Vercel preview deployment. Preview deployments may sit behind Vercel deployment protection, which would block the AI apps. Ask the owner before deploying or changing protection settings.
5. Log the protocol version, method and headers of what each client sends.

Done when you can state, with evidence: which spec revisions Claude and ChatGPT use, which SDK package serves them from a Next.js route handler without session state, and whether each client registers by CIMD or DCR. Write the findings into this file under a new "Phase 0 findings" heading and adjust the later phases if they contradict the plan. Then stop and tell the owner.

## Phase 0 findings (2026-11-25)

Stub: `src/app/mcp/route.ts` (logs every request, never the token) and `src/lib/mcp/server.ts` (one `whoami` tool).

- **SDK: `@modelcontextprotocol/server` 2.4.0**, the official v2 line. `createMcpHandler(factory)` returns a web `fetch` handler that drops straight into a Next.js route handler. It serves 2026-07-28 requests and, by default, 2025-era requests statelessly from the same factory, so one tool definition covers both. Not `@modelcontextprotocol/sdk` (v1) and not `mcp-handler` (an extra wrapper we do not need). It needs zod 4.2 or later, so zod went from 4.1.1 to 4.6.7. The package manager in use is yarn (`yarn.lock` is current, `package-lock.json` is stale since Oct 2025).
- **The SDK also ships the resource-server half of auth**: `requireBearerAuth` (with `expectedResource` audience check and scope check), `bearerAuthChallengeResponse` (401/403 with `resource_metadata`), `oauthMetadataResponse` and `getOAuthProtectedResourceMetadataUrl` (path-aware PRM, e.g. `/.well-known/oauth-protected-resource/mcp/b/<id>`), `originValidationResponse`. Phase 1 uses these instead of hand-rolling. The authorization server half (authorize, token, register) is still ours to build.
- **Claude Code 2.1.332 speaks 2026-07-28**: `server/discover`, then `subscriptions/listen`, `tools/list`, `tools/call`, all with the `_meta` envelope. Tested headless against localhost; the tool call worked.
- **`subscriptions/listen` is a long-lived SSE stream** that Claude Code opens right away. On Vercel it will be cut at the function timeout and the in-memory event bus does not span instances. Acceptable: we do not push list changes. Do not rely on it.
- **The SDK's own client still defaults to 2025-11-25** and only negotiates 2026-07-28 when asked. Expect a mix of eras from clients for a while; keep the legacy fallback on.
- Both eras verified end to end with the v2 client (`legacy` and `auto` negotiation): discover or initialize, list, call.

**Still open, needs a public URL:** what Claude.ai and ChatGPT send, and whether they register by CIMD or DCR. Both can only reach a deployed URL. Phase 1 implements both registration paths anyway, so this does not block starting phase 1; it blocks calling phase 1 done.

## Build status (2026-11-25)

Phases 1 and 2 are built on branch `mcp-phase-0`. Tested against a throwaway local database (PGlite), never production:

- `scripts/mcp-smoke.ts`: 45 checks, all passing (after fixing the 10 issues from /code-review: canonical resource URLs, SSRF-safe metadata fetch with connect-time address checks, Kobo per-link leak, no framing of the consent page, edits lost when opening Connect AI from the edit sheet, narrower replay revoke, start_activity needs write, a link's results are deleted with it, `$` in titles, unknown-only scopes refused). Covers discovery, registration, PKCE, single-use codes, scoping (per-Bundel vs account, other users' Bundels), every tool, the skip list, sub-Bundel privacy, refresh rotation with reuse detection, revocation and the daily limit.
- The official v2 MCP client ran the real flow: discovery, Dynamic Client Registration, the consent page in headless Chrome, token exchange, 2026-07-28 negotiation, then add_links, start_activity and save_results.
- The UI was checked in screenshots: consent page, link chip expanded, remove with "Never show this site", Account (connected apps, sites to skip), Connect AI sheet, research buttons in the edit sheet, the sub-Bundel page.

Where the build differs from the plan:

- "Find deals" for a link without results lives in the link's edit sheet ("Research with AI", copies the request), not as a chip on every row. A chip on every link was too noisy.
- Results from compare (no source link) show in a "Found by AI" card above the links.
- Private Bundels are still reachable by link for everyone, as before. Only private sub-Bundels are owner-only (page, Kobo view, preview image).
- MCP adds set the favicon to the Google favicon URL directly, which is what `/api/favicon` returns first, so there is no fetch and no `after()`.
- Registering a username that matches a top-level path (`mcp`, `oauth`, `about`, ...) is now refused.
- Creating a sub-Bundel triggers the same emoji and header generation as any new Bundel, so each one costs one small OpenAI call.

Still to do before it is live:

1. Done 2026-11-25: the six new tables are on the production database.
2. Claude.ai connected for real on production on 2026-11-25. It registers with a Client ID Metadata Document (`https://claude.ai/oauth/mcp-oauth-client-metadata`), not DCR, and redirects to claude.ai. ChatGPT is still to be tried. The setup steps in the Connect AI sheet for ChatGPT are from memory; check the menu names.

## Phase 1: sign-in and adding links

### Shared core

The server actions get the user from the session; MCP gets it from a token. Extract the logic of creating a Bundel and adding links into functions that take a `userId` (suggested: `src/lib/bundel-core.ts`), and have the existing server actions call them. Keep the refactor to what MCP needs. Behavior of the existing UI must not change.

Adding up to 25 links must not wait on 25 favicon lookups: `addLink` today fetches the favicon before inserting and retries with `setImmediate`, which is unreliable on serverless. For the MCP path, insert first and fill favicons afterwards with `after()` from `next/server`.

### OAuth server

Bundel becomes its own OAuth 2.1 authorization server on top of the existing login. NextAuth is not replaced.

- `/.well-known/oauth-protected-resource` (RFC 9728), including the path-specific form for each MCP URL. Check the Authorization page of the spec for the exact well-known path rules.
- `/.well-known/oauth-authorization-server` (RFC 8414), advertising `code_challenge_methods_supported: ["S256"]`, `client_id_metadata_document_supported: true`, and the registration endpoint.
- `/oauth/authorize`: validates the client (CIMD document fetched with a private-address guard, or a `McpClient` row), exact `redirect_uri` match, PKCE S256, and a `resource` parameter that must be one of our MCP URLs. If the user is not logged in, send them through `/login` and back. Then show a consent page naming the app, the redirect host and the Bundel (or "your whole account"). On approve, issue a one-time code.
- `/oauth/token`: `authorization_code` and `refresh_token` grants. `resource` must match the code. Access tokens last 1 hour. Refresh tokens rotate; reuse of an old refresh token revokes the grant.
- `/oauth/register`: DCR fallback, rate-limited.
- Tokens are random opaque strings. Store only SHA-256 hashes. Never accept a token in a query string.

### Scoping

A grant row holds `userId` and an optional `bundelId`. The per-Bundel URL is the OAuth `resource`, so a token issued for `/mcp/b/abc` is only valid at `/mcp/b/abc`.

On every MCP request check all of: the token exists, is unexpired and unrevoked; it was issued for this exact URL; the Bundel in the URL belongs to the token's user; and any Bundel or link id in the tool arguments is the scoped Bundel or one of its sub-Bundels. An id in an argument is a name, not a permission. A missing or bad token returns 401 with `WWW-Authenticate: Bearer resource_metadata="..."`; a token lacking the scope returns 403 with `error="insufficient_scope"`. Validate the `Origin` header as the transport page requires.

Scopes: `bundel:read`, `bundel:write`.

### Tools in this phase

| Tool | Behavior |
| --- | --- |
| `list_bundels` | Bundels this connection may touch: id, title, URL, link count. |
| `get_bundel` | Links with ids, titles, URLs, notes, plus sub-Bundels once phase 2 exists. |
| `add_links` | `bundel_id` optional on a per-Bundel connection. Up to 25 links of `{url, title?, note?}`. Normalize URLs, derive a title with `titleFromUrl` when missing, skip URLs already in the Bundel, return created link ids and which were skipped. |
| `create_bundel` | Account-wide connections only. Title plus optional links. |

Give each tool an `outputSchema` and return `structuredContent` alongside the same JSON as text. Report failures as tool results with `isError: true` so the model can correct itself. Set tool annotations honestly (read-only on the two read tools, not destructive on the two write tools). Cap string lengths with the limits the existing zod schemas already use (title 100, context 280).

### UI in this phase

- A **Connect AI** entry on the owner's Bundel page that opens a sheet with the per-Bundel URL, a copy button and two-line instructions each for Claude and ChatGPT. Follow the existing sheet components in `src/components/bundel/`.
- **Connected AI apps** in Account: app name, which Bundel or "whole account", last used, a revoke button. Also the account-wide URL.

### Limits

Count calls per grant in the database: 200 calls a day, 25 links a call. Return a clear tool error when over.

### Also in this phase

Add the `PRIVATE_HOST` block from `/api/unfurl` to `/api/favicon`. MCP makes it easy to feed that route arbitrary URLs.

Done when: a script (suggested `scripts/mcp-smoke.ts`) runs the full OAuth flow against the local server and then adds a link through `add_links`; a per-Bundel token is rejected at the account URL and at another Bundel's URL, and cannot write to a Bundel outside its scope by passing that Bundel's id; revoking in Account makes the next call return 401; the owner has added a link from a real AI app; `npm run build` and `npm run lint` pass.

## Phase 2: activities and sub-Bundels

### Activities

An activity is a named template with a `{{link}}` slot and a block of instructions for the AI. Define four in code: Find deals, Find alternatives, Find places to stay nearby, Compare these. Write the instructions as you would brief a capable researcher: what to look for, what to compare, how many results to return, what the one-line note per result should contain (shop and price for deals), and which domains to avoid.

| Tool | Behavior |
| --- | --- |
| `list_activities` | Templates that fit a given link or Bundel. |
| `start_activity` | Takes an activity key and a link id. Returns the filled-in instructions, the user's skip list, and a run id. The run id is a server-minted handle that ties the later save to this user, link and activity; it is the stateless way to carry state between calls. |
| `save_results` | Takes the run id, a title and up to 25 links of `{url, title, note}`. Creates a private sub-Bundel under the source link, or adds to the existing one for that link and activity. Drops links on skipped domains and reports how many it dropped. Returns the sub-Bundel URL. |

`add_links` now also returns the activities that fit each link it saved. That is what makes the AI offer "want me to find deals for this?" unprompted.

Expose the same four activities as MCP prompts with a `link` argument for clients that show slash commands. The tool route is the one that must work everywhere.

### Sub-Bundels in the app

- Hide sub-Bundels from every listing named in "Repo facts". A sub-Bundel reachable only through its parent link is the intent.
- Confirm that a private Bundel is not viewable by non-owners at its own URL. `isPublic` exists on `LinkLink`; I did not check that `src/app/[username]/[slug]/page.tsx` enforces it. If it does not, fix that first, because AI-written content must not be publicly reachable by default.
- Owner view: the chip, the in-place expansion, "N more", "Open as Bundel", per-result remove with "Never show this site". Removing a result is the existing `deleteLink`, since the sub-Bundel is the owner's own Bundel. Visitors see the parent link with no chip while the sub-Bundel is private.
- A "Find deals" chip on links without results that hands the user the prompt for their AI app (copy to clipboard is enough for v1).
- **Sites to skip** in Account: add and remove domains. Normalize on save (lowercase, strip `www.`, strip protocol and path). Matching covers subdomains: `amazon.com` blocks `www.amazon.com` and `smile.amazon.com`.

A reference mock-up of the expanded row: a card with favicon, title and domain; under them a tinted pill "5 deals found" with a chevron; when open, an indented list with a thin vertical rail, each result showing a small favicon, the shop name in semibold and a one-line note in muted text, with a muted × at the right; a footer line with "2 more" on the left and "Open as Bundel" on the right. Match the existing row styling in `LinkRow.tsx` and `styles.ts` rather than inventing new tokens.

Done when: the smoke script runs `start_activity` then `save_results` and the sub-Bundel shows expanded under its link on the owner's Bundel page; a result on a skipped domain is dropped; the sub-Bundel does not appear on the dashboard, profile, directory, search, feeds or the follower digest, and returns not-found to a logged-out visitor; the owner has run "find deals" end to end from a real AI app.

## Data model

Sketch, to be adjusted to what phase 0 finds. All new tables.

- `SubBundel`: `childId` (id, references `LinkLink`, cascade), `parentId` (references `LinkLink`, cascade), `sourceLinkId` (references `Link`, set null), `activity` (string), `createdAt`. Index on `parentId` and on `sourceLinkId`.
- `McpGrant`: `id`, `userId`, `bundelId` (nullable), `clientId`, `clientName`, `scopes`, `resource`, `accessTokenHash` (unique), `accessExpiresAt`, `refreshTokenHash` (unique), `lastUsedAt`, `revokedAt`, `callsDay`, `callsCount`, `createdAt`.
- `McpAuthCode`: `codeHash` (id), `userId`, `bundelId`, `clientId`, `redirectUri`, `codeChallenge`, `resource`, `scopes`, `expiresAt` (60 seconds), `usedAt`.
- `McpClient`: DCR-registered clients. `id`, `name`, `redirectUris`, `createdAt`.
- `McpRun`: activity runs. `id`, `grantId`, `linkId`, `activity`, `expiresAt`. (Alternatively a signed handle with no table; choose whichever is simpler once the tool code exists.)
- `BlockedSite`: `userId`, `domain`, `createdAt`, unique on the pair.

## Security requirements

- Text that comes back from tools (link titles, notes) is untrusted and lands in the user's AI conversation. Do not expose visitor-written content (`Suggestion`, `Comment`) over MCP. Do not put instructions to the model inside data fields.
- Accept only tokens this server issued for this exact resource. Never forward a token anywhere.
- Guard every server-side fetch triggered by MCP input against private addresses: CIMD documents, favicons.
- Consent must be explicit per client and per Bundel, and must show the redirect host, so a malicious client cannot ride on an earlier approval.

## Later phases, not part of this build

Phase 3: custom activity templates per Bundel, a switch to make a sub-Bundel visible to visitors, rendering the Bundel as a card inside the AI app (MCP Apps), listing in the MCP Registry. Phase 4: Bundel running activities itself on a schedule (price watch), which costs us AI spend and would be paid. Do not start these.

## When to stop and ask

- After phase 0, with the findings.
- Before `prisma db push` against any database you have not confirmed is a dev database.
- Before any Vercel deployment or change to deployment protection.
- If phase 0 shows the clients need something that conflicts with a decision above.
- At the end of each phase, with what to test and where.

Otherwise keep going; routine choices inside a phase are yours.
