import { prisma } from "@/lib/prisma"
import { rssResponse } from "@/lib/rss"

// New links across a curator's public Bundels.
export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, name: true } })
  if (!user) return new Response("Not found", { status: 404 })

  const links = await prisma.link.findMany({
    where: { linkylink: { userId: user.id, isPublic: true, type: "NORMAL" } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { linkylink: { select: { title: true } } },
  })

  return rssResponse({
    title: `${user.name || `@${username}`} on Bundel`,
    description: `Links collected by @${username}`,
    path: `/${username}`,
    items: links.map((l) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      date: l.createdAt,
      description: [l.context, `In “${l.linkylink.title}”`].filter(Boolean).join(" — "),
    })),
  })
}
