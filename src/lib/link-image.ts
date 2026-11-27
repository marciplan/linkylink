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

/** The page's share image as an absolute https URL, or null. */
export async function findLinkImage(pageUrl: string): Promise<string | null> {
  let start: URL
  try {
    start = new URL(pageUrl)
  } catch {
    return null
  }
  const page = await fetchPublicHead(start)
  if (!page) return null
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

/**
 * Look up and store preview images for these links once the response is out. "" marks
 * "none found". Each link is claimed first (null → ""), so busy pages don't fetch it twice.
 */
export function fillLinkImages(links: { id: string; url: string }[]) {
  if (links.length === 0) return
  after(async () => {
    await Promise.all(
      links.map(async (link) => {
        const claimed = await prisma.link.updateMany({ where: { id: link.id, image: null }, data: { image: "" } }).catch(() => null)
        if (!claimed?.count) return
        const image = await findLinkImage(link.url).catch(() => null)
        if (image) await prisma.link.update({ where: { id: link.id }, data: { image } }).catch(() => {})
      })
    )
  })
}
