import { notFound } from "next/navigation"
import { Metadata, Viewport } from "next"
import { prisma } from "@/lib/prisma"
import { incrementViews } from "@/lib/actions"
import { auth } from "@/lib/auth"
import { bundelHue, bundelThemeColor } from "@/lib/theme"
import { BundelVisitorView } from "./BundelVisitorView"
import { OwnerView, YearReview } from "./views"

interface PageProps {
  params: Promise<{
    username: string
    slug: string
  }>
  searchParams: Promise<{ view?: string }>
}

// Browser chrome takes on the Bundel's colour so the hero runs edge to edge.
export async function generateViewport({ params }: PageProps): Promise<Viewport> {
  const { slug } = await params
  const bundel = await prisma.linkLink.findUnique({ where: { slug }, select: { slug: true, type: true } })
  if (!bundel || bundel.type !== "NORMAL") {
    return {
      themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
        { media: "(prefers-color-scheme: dark)", color: "#111114" },
      ],
    }
  }
  return { themeColor: bundelThemeColor(bundelHue(bundel.slug)) }
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

export default async function PublicLinkylinkPage({ params, searchParams }: PageProps) {
  const { username, slug } = await params
  const { view: viewMode } = await searchParams
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

  const ownerView = isOwner && viewMode !== "public"
  const view = linkylink.type === "YEAR_REVIEW"
    ? <YearReview linkylink={linkylink} isOwner={isOwner} />
    : ownerView
      ? <OwnerView bundel={linkylink} commentCounts={commentCountMap} />
      : <BundelVisitorView
          bundel={linkylink}
          currentUser={sessionUser}
          commentCounts={commentCountMap}
          previewHref={isOwner ? `/${username}/${slug}` : undefined}
        />

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
