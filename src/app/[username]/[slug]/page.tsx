import { fillLinkImages, needsLinkImage } from "@/lib/link-image"
import { shownLinkImage } from "@/lib/http-url"
import { notFound } from "next/navigation"
import { Metadata, Viewport } from "next"
import { prisma } from "@/lib/prisma"
import { incrementViews } from "@/lib/actions"
import { auth } from "@/lib/auth"
import { bundelIcon } from "@/lib/bundel-icon"
import { bundelTone } from "@/lib/emoji-tone"
import { toneThemeColor } from "@/lib/tone"
import { optional } from "@/lib/optional"
import { isHiddenFrom, subBundelParent } from "@/lib/sub-bundels"
import { summarizeVotes } from "@/lib/sharing"
import { BundelVisitorView } from "./BundelVisitorView"
import { OwnerView, ReviewOwner } from "./views"
import { ReviewVisitorView } from "./ReviewVisitorView"
import { shareMetadata } from "@/lib/seo"

interface PageProps {
  params: Promise<{
    username: string
    slug: string
  }>
  searchParams: Promise<{ view?: string; l?: string }>
}

// Browser chrome takes on the Bundel's colour so the hero runs edge to edge.
export async function generateViewport({ params }: PageProps): Promise<Viewport> {
  const { slug } = await params
  const bundel = await prisma.linkLink.findUnique({ where: { slug }, select: { slug: true, type: true, title: true, avatar: true, user: { select: { image: true } } } })
  if (!bundel || bundel.type !== "NORMAL") {
    return {
      themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
        { media: "(prefers-color-scheme: dark)", color: "#111114" },
      ],
    }
  }
  return { themeColor: toneThemeColor(bundelTone(bundel.slug, bundelIcon(bundel.avatar, bundel.user.image, bundel.title))) }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { username, slug } = await params
  const { l: focusId } = await searchParams

  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: { user: true, links: { orderBy: { order: "asc" }, take: 3, select: { title: true } }, _count: { select: { links: true } } },
  })

  if (!linkylink || linkylink.user.username !== username || (await isHiddenFrom(linkylink, (await auth())?.user?.id))) {
    return {}
  }

  const pageUrl = `/${username}/${slug}`
  const authorName = linkylink.user.name || linkylink.user.username
  const [ask, focus] = await Promise.all([
    optional(prisma.ask.findUnique({ where: { linkylinkId: linkylink.id } }), null),
    focusId ? prisma.link.findFirst({ where: { id: focusId, linkylinkId: linkylink.id } }) : null,
  ])

  // A shared single link previews as that link with the curator's note.
  const title = focus ? `${focus.title} · via @${username}` : linkylink.title
  const description = focus
    ? focus.context || `From “${linkylink.title}” by @${username}`
    : ask
      ? `Help @${username} pick: ${ask.question || linkylink.title}`
      : buildDescription(linkylink)

  return {
    title: `${title} - Bundel`,
    description,
    authors: [{ name: authorName, url: `/${username}` }],
    robots: linkylink.isPublic ? undefined : { index: false, follow: false },
    ...shareMetadata({
      title,
      description,
      path: focus ? `${pageUrl}?l=${focus.id}` : pageUrl,
      canonical: pageUrl,
      image: focus ? `/api/og/${slug}?l=${focus.id}` : `/api/og/${slug}`,
      imageAlt: focus ? `${focus.title}, shared from ${linkylink.title} on Bundel` : `${linkylink.title} by ${authorName} on Bundel`,
      type: linkylink.type === "YEAR_REVIEW" ? "article" : "website",
    }),
  }
}

/** What a link preview says under the title: the curator's line, then what's inside. */
function buildDescription(linkylink: {
  title: string
  subtitle: string | null
  user: { username: string; name: string | null }
  links?: { title: string }[]
  _count?: { links: number }
}): string {
  const count = linkylink._count?.links ?? 0
  const inside = (linkylink.links ?? []).map((l) => l.title).join(", ")
  const by = linkylink.user.name || `@${linkylink.user.username}`
  const summary = count > 0 ? `${count} ${count === 1 ? "link" : "links"} by ${by}${inside ? `: ${inside}${count > 3 ? " and more" : ""}` : ""}` : `A Bundel by ${by}`
  const text = linkylink.subtitle ? `${linkylink.subtitle} · ${summary}` : summary
  return text.length > 200 ? `${text.slice(0, 197)}…` : text
}

export default async function PublicLinkylinkPage({ params, searchParams }: PageProps) {
  const { username, slug } = await params
  const { view: viewMode, l: focusLinkId } = await searchParams
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

  if (!linkylink || linkylink.user.username !== username || (await isHiddenFrom(linkylink, session?.user?.id))) {
    notFound()
  }

  // Links added before preview images existed (or by import) get theirs on first view.
  fillLinkImages(
    linkylink.links
      .filter((l) => needsLinkImage(l.image))
      .slice(0, 12)
      .map((l) => ({ id: l.id, url: l.url, image: l.image }))
  )
  // From here on, image is only ever a URL to show.
  for (const l of linkylink.links) l.image = shownLinkImage(l.image)

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

  // Sharing features (each falls back to "off" if its table isn't there yet)
  const isNormal = linkylink.type === "NORMAL"
  const [ask, voteSummary, remix, suggestions] = isNormal
    ? await Promise.all([
        optional(prisma.ask.findUnique({ where: { linkylinkId: linkylink.id } }), null),
        optional(summarizeVotes(linkylink.id), {}),
        optional(
          prisma.remix.findUnique({
            where: { copyId: linkylink.id },
            select: { source: { select: { title: true, slug: true, user: { select: { username: true } } } } },
          }),
          null
        ),
        isOwner
          ? optional(prisma.suggestion.findMany({ where: { linkylinkId: linkylink.id }, orderBy: { createdAt: "asc" } }), [])
          : [],
      ])
    : [null, {}, null, []]
  // What AI activities found, for the owner only (visitors never see private results).
  const [subRows, parentRow] = isNormal && isOwner
    ? await Promise.all([
        optional(
          prisma.subBundel.findMany({
            where: { parentId: linkylink.id, child: { userId: linkylink.userId } },
            orderBy: { createdAt: "asc" },
            select: {
              activity: true,
              sourceLinkId: true,
              child: {
                select: {
                  id: true, title: true, slug: true,
                  links: { orderBy: { order: "asc" }, select: { id: true, title: true, url: true, context: true, favicon: true } },
                },
              },
            },
          }),
          []
        ),
        subBundelParent(linkylink.id),
      ])
    : [[], null]
  const subBundels = subRows.map((s) => ({
    id: s.child.id,
    title: s.child.title,
    path: `/${username}/${s.child.slug}`,
    activity: s.activity,
    sourceLinkId: s.sourceLinkId,
    links: s.child.links,
  }))
  const subBundelOf = parentRow
    ? { title: parentRow.parent.title, path: `/${parentRow.parent.user.username}/${parentRow.parent.slug}`, isPublic: linkylink.isPublic }
    : null

  const askSettings = ask
    ? { kind: ask.kind, question: ask.question, allowSuggestions: ask.allowSuggestions, closed: ask.closed }
    : null
  const remixedFrom = remix?.source
    ? { title: remix.source.title, path: `/${remix.source.user.username}/${remix.source.slug}`, username: remix.source.user.username }
    : null

  // "Updated" means a link was added; bundel.updatedAt also moves on every view.
  const updatedAt = linkylink.links.reduce<Date>((latest, l) => (l.createdAt > latest ? l.createdAt : latest), linkylink.createdAt)

  // Increment views (don't await to not block rendering)
  incrementViews(slug)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: linkylink.title,
    description: buildDescription({ ...linkylink, links: linkylink.links.slice(0, 3), _count: { links: linkylink.links.length } }),
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
    ? ownerView
      ? <ReviewOwner review={linkylink} />
      : <ReviewVisitorView review={linkylink} previewHref={isOwner ? `/${username}/${slug}` : undefined} />
    : ownerView
      ? <OwnerView
          bundel={linkylink}
          commentCounts={commentCountMap}
          ask={askSettings}
          voteSummary={voteSummary}
          suggestions={suggestions.map((x) => ({ id: x.id, url: x.url, title: x.title, note: x.note, name: x.name }))}
          remixedFrom={remixedFrom}
          subBundels={subBundels}
          subBundelOf={subBundelOf}
          updatedAt={updatedAt}
        />
      : <BundelVisitorView
          bundel={linkylink}
          currentUser={sessionUser}
          commentCounts={commentCountMap}
          previewHref={isOwner ? `/${username}/${slug}` : undefined}
          ask={askSettings}
          voteSummary={voteSummary}
          focusLinkId={focusLinkId}
          remixedFrom={remixedFrom}
          updatedAt={updatedAt}
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
