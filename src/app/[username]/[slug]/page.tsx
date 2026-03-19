import { notFound } from "next/navigation"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { incrementViews } from "@/lib/actions"
import { auth } from "@/lib/auth"
import PublicLinkView from "./PublicLinkView"
import YearReviewView from "./YearReviewView"

interface PageProps {
  params: Promise<{
    username: string
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params
  
  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: { user: true },
    // Note: headerImage, headerPrompt, headerImages are included by default
  })

  if (!linkylink || linkylink.user.username !== username) {
    return {}
  }

  // Use a relative path; Next.js will resolve against metadataBase
  // to emit an absolute URL for social crawlers.
  const ogImageUrl = `/api/og/${slug}`

  return {
    title: `${linkylink.title} - Bundel`,
    description: linkylink.subtitle || `Check out ${linkylink.title} by @${linkylink.user.username}`,
    openGraph: {
      title: linkylink.title,
      description: linkylink.subtitle || `Check out ${linkylink.title} by @${linkylink.user.username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: linkylink.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: linkylink.title,
      description: linkylink.subtitle || `Check out ${linkylink.title} by @${linkylink.user.username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: linkylink.title,
        },
      ],
    },
  }
}

export default async function PublicLinkylinkPage({ params }: PageProps) {
  const { username, slug } = await params
  const session = await auth()
  
  // Run main query and session fetch in parallel
  const [linkylink, sessionUser] = await Promise.all([
    prisma.linkLink.findUnique({
      where: { slug },
      include: {
        user: true,
        links: {
          orderBy: { order: "asc" },
        },
        categories: {
          orderBy: { order: "asc" },
          include: {
            items: {
              orderBy: { rank: "asc" },
            },
          },
        },
      },
    }),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, username: true, image: true },
        })
      : null,
  ])

  if (!linkylink || linkylink.user.username !== username) {
    notFound()
  }

  // Check if current user is the owner
  const isOwner = session?.user?.id === linkylink.userId

  // Fetch comment counts in parallel (non-blocking after notFound check)
  const linkIds = linkylink.links.map(l => l.id)
  const commentCounts = linkIds.length > 0 ? await prisma.comment.groupBy({
    by: ['linkId'],
    where: { linkId: { in: linkIds } },
    _count: true,
  }) : []
  const commentCountMap: Record<string, number> = {}
  for (const c of commentCounts) {
    commentCountMap[c.linkId] = c._count
  }

  // Increment views (don't await to not block rendering)
  incrementViews(slug)

  // Render appropriate view based on type
  if (linkylink.type === "YEAR_REVIEW") {
    return <YearReviewView linkylink={linkylink} isOwner={isOwner} />
  }

  return <PublicLinkView linkylink={linkylink} isOwner={isOwner} currentUser={sessionUser} commentCounts={commentCountMap} />
}
