import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"
import { fillLinkImages } from "@/lib/link-image"
import { domainOf, faviconFor, normalizeUrl, titleFromUrl } from "@/lib/links"

// Bundel writes that both the app (session user) and the MCP server (token
// user) need. Callers check who the user is; these check what they may touch.

export const LIMITS = { title: 100, subtitle: 200, context: 280, url: 2048, linksPerCall: 25 } as const

export async function uniqueSlug(title: string): Promise<string> {
  const base = generateSlug(title) || "bundel"
  let slug = base
  for (let n = 1; await prisma.linkLink.findUnique({ where: { slug }, select: { id: true } }); n++) {
    slug = `${base}-${n}`
  }
  return slug
}

/** Fire-and-forget emoji and header generation, the same as creating a Bundel in the app. */
export function generateBundelDefaults(linkylinkId: string, title: string, subtitle?: string | null) {
  fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/generate-defaults`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkylinkId, title, subtitle }),
  }).catch((err) => console.error("Failed to trigger background generation:", err))
}

export interface IncomingLink {
  url: string
  title?: string | null
  note?: string | null
}

export interface CleanLink {
  url: string
  title: string
  context: string | null
}

/** Normalize, validate and trim links. Returns the good ones and the URLs it could not use. */
export function cleanLinks(input: IncomingLink[]): { links: CleanLink[]; invalid: string[] } {
  const links: CleanLink[] = []
  const invalid: string[] = []
  for (const item of input) {
    const raw = (item.url ?? "").trim()
    let url: URL
    try {
      url = new URL(normalizeUrl(raw))
    } catch {
      invalid.push(raw)
      continue
    }
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || url.href.length > LIMITS.url) {
      invalid.push(raw)
      continue
    }
    const title = (item.title ?? "").trim() || titleFromUrl(url.href) || domainOf(url.href)
    const note = (item.note ?? "").trim()
    links.push({
      url: url.href,
      title: title.slice(0, LIMITS.title),
      context: note ? note.slice(0, LIMITS.context) : null,
    })
  }
  return { links, invalid }
}

/** Same URL ignoring a trailing slash, the fragment and "www.". */
export function urlKey(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ""
    const host = u.hostname.replace(/^www\./, "").toLowerCase()
    const path = u.pathname.replace(/\/+$/, "")
    return `${host}${path}${u.search}`
  } catch {
    return url
  }
}

/**
 * Append links to a Bundel the user owns, skipping URLs already in it (and
 * repeats within the call). Favicons use the same lookup service the app's
 * favicon route tries first, so no fetch is needed here.
 */
export async function appendLinks(userId: string, linkylinkId: string, input: CleanLink[]) {
  const bundel = await prisma.linkLink.findFirst({
    where: { id: linkylinkId, userId },
    select: { id: true, links: { select: { url: true, order: true } } },
  })
  if (!bundel) throw new Error("Bundel not found")

  const seen = new Set(bundel.links.map((l) => urlKey(l.url)))
  let order = bundel.links.reduce((max, l) => Math.max(max, l.order), -1) + 1
  const toCreate: (CleanLink & { order: number })[] = []
  const duplicates: string[] = []
  for (const link of input) {
    const key = urlKey(link.url)
    if (seen.has(key)) {
      duplicates.push(link.url)
      continue
    }
    seen.add(key)
    toCreate.push({ ...link, order: order++ })
  }

  const created = await prisma.$transaction(
    toCreate.map((link) =>
      prisma.link.create({
        data: {
          linkylinkId,
          title: link.title,
          url: link.url,
          context: link.context,
          favicon: faviconFor(link.url),
          order: link.order,
        },
        select: { id: true, title: true, url: true, context: true },
      })
    )
  )
  if (created.length > 0) {
    await prisma.linkLink.update({ where: { id: linkylinkId }, data: { updatedAt: new Date() } })
    fillLinkImages(created)
  }
  return { created, duplicates }
}

export async function createBundelForUser(
  userId: string,
  data: { title: string; subtitle?: string | null; isPublic?: boolean },
  options: { generateDefaults?: boolean } = {}
) {
  const title = data.title.trim().slice(0, LIMITS.title) || "Untitled"
  const subtitle = data.subtitle?.trim().slice(0, LIMITS.subtitle) || undefined
  const bundel = await prisma.linkLink.create({
    data: { title, subtitle, slug: await uniqueSlug(title), userId, isPublic: data.isPublic ?? true },
    select: { id: true, slug: true, title: true, user: { select: { username: true } } },
  })
  if (options.generateDefaults !== false) generateBundelDefaults(bundel.id, title, subtitle)
  return bundel
}
