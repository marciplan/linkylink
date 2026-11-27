import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchPublicHead } from "@/lib/net"

// Preview images (og:image) for links. Looked up after the response is sent, so
// adding a link or opening a Bundel never waits on someone else's server.

function decode(text: string) {
  return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").trim()
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
    "i"
  )
  const m = html.match(re)
  const value = m?.[1] ?? m?.[2]
  return value ? decode(value) : null
}

/** The page's share image as an absolute https URL, null when it has none, undefined when the page could not be read. */
export async function findLinkImage(pageUrl: string): Promise<string | null | undefined> {
  let start: URL
  try {
    start = new URL(pageUrl)
  } catch {
    return null
  }
  const page = await fetchPublicHead(start)
  if (!page) return undefined
  for (const key of ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"]) {
    const raw = metaContent(page.html, key)
    if (!raw) continue
    try {
      const image = new URL(raw, page.url)
      if (image.protocol === "http:") image.protocol = "https:"
      if (image.protocol === "https:" && image.toString().length <= 2048) return image.toString()
    } catch {}
  }
  return null
}

// Link.image: an https URL, "" when the page has none, null when not looked up yet, or
// "retry:<ms>" while a lookup runs or after one failed: try again once that time has passed.
const RETRY = "retry:"
const CLAIM_MS = 10 * 60 * 1000
const FAILED_MS = 24 * 60 * 60 * 1000

/** True when this link's image should be looked up now. */
export function needsLinkImage(image: string | null | undefined, now = Date.now()): boolean {
  if (image == null) return true
  return image.startsWith(RETRY) && Number(image.slice(RETRY.length)) < now
}

/**
 * Look up and store preview images for these links once the response is out. Each link is
 * claimed first, from the value we saw, so busy pages don't fetch it twice.
 */
export function fillLinkImages(links: { id: string; url: string; image?: string | null }[]) {
  if (links.length === 0) return
  after(async () => {
    await Promise.all(
      links.map(async (link) => {
        const claimed = await prisma.link
          .updateMany({ where: { id: link.id, image: link.image ?? null }, data: { image: RETRY + (Date.now() + CLAIM_MS) } })
          .catch(() => null)
        if (!claimed?.count) return
        const found = await findLinkImage(link.url).catch(() => undefined)
        const image = found === undefined ? RETRY + (Date.now() + FAILED_MS) : (found ?? "")
        await prisma.link.update({ where: { id: link.id }, data: { image } }).catch(() => {})
      })
    )
  })
}
