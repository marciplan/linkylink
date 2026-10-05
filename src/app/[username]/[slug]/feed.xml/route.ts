import { prisma } from "@/lib/prisma"
import { rssResponse } from "@/lib/rss"

// New links in a single Bundel.
export async function GET(_request: Request, { params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params
  const bundel = await prisma.linkLink.findUnique({
    where: { slug },
    select: { title: true, subtitle: true, isPublic: true, user: { select: { username: true } }, links: { orderBy: { createdAt: "desc" }, take: 50 } },
  })
  if (!bundel || !bundel.isPublic || bundel.user.username !== username) return new Response("Not found", { status: 404 })

  return rssResponse({
    title: bundel.title,
    description: bundel.subtitle || `A Bundel by @${username}`,
    path: `/${username}/${slug}`,
    items: bundel.links.map((l) => ({ id: l.id, title: l.title, url: l.url, date: l.createdAt, description: l.context ?? "" })),
  })
}
