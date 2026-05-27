import { notFound } from "next/navigation"
import { Metadata, Viewport } from "next"
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params

  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: { user: true },
  })

  if (!linkylink || linkylink.user.username !== username) {
    return {}
  }

  const pageUrl = `/${username}/${slug}`
  const description = buildDescription(linkylink)
  const authorName = linkylink.user.name || linkylink.user.username

  const ogImage = {
    url: `/api/og/${slug}`,
    width: 1200,
    height: 630,
    alt: linkylink.title,
    type: "image/png",
  }

  return {
    title: `${linkylink.title} - Bundel`,
    description,
    alternates: { canonical: pageUrl },
    authors: [{ name: authorName, url: `/${username}` }],
    robots: linkylink.isPublic ? undefined : { index: false, follow: false },
    openGraph: {
      title: linkylink.title,
      description,
      url: pageUrl,
      type: linkylink.type === "YEAR_REVIEW" ? "article" : "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: linkylink.title,
      description,
      images: [ogImage],
    },
  }
}

function buildDescription(linkylink: { title: string; subtitle: string | null; user: { username: string } }): string {
  return linkylink.subtitle || `Check out ${linkylink.title} by @${linkylink.user.username}`
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: linkylink.title,
    description: buildDescription(linkylink),
    url: `/${username}/${slug}`,
    author: {
      "@type": "Person",
      name: linkylink.user.name || linkylink.user.username,
      url: `/${username}`,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: linkylink.links.length,
      itemListElement: linkylink.links.map((link, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: link.title,
        url: link.url,
      })),
    },
  }

  const view = linkylink.type === "YEAR_REVIEW"
    ? <YearReviewView linkylink={linkylink} isOwner={isOwner} />
    : <PublicLinkView linkylink={linkylink} isOwner={isOwner} currentUser={sessionUser} commentCounts={commentCountMap} />

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {view}
    </>
  )
}
