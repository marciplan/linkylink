import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Link2, Plus, Search, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { buttonStyles } from "@/components/ui/button"
import { generateRecommendations } from "@/lib/recommendations"
import { LinkylinkCard } from "@/components/LinkylinkCard"
import { DashboardSearch } from "@/components/DashboardSearch"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const sp = await searchParams
  const searchQuery = sp.search?.trim()
  
  const linkylinks = await prisma.linkLink.findMany({
    where: {
      userId: session.user.id,
      ...(searchQuery && {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { subtitle: { contains: searchQuery, mode: 'insensitive' } },
          {
            links: {
              some: {
                OR: [
                  { title: { contains: searchQuery, mode: 'insensitive' } },
                  { url: { contains: searchQuery, mode: 'insensitive' } },
                  { context: { contains: searchQuery, mode: 'insensitive' } }
                ]
              }
            }
          },
          // Search in Year Review categories
          {
            categories: {
              some: {
                name: { contains: searchQuery, mode: 'insensitive' }
              }
            }
          },
          // Search in Year Review category items
          {
            categories: {
              some: {
                items: {
                  some: {
                    OR: [
                      { title: { contains: searchQuery, mode: 'insensitive' } },
                      { url: { contains: searchQuery, mode: 'insensitive' } },
                      { context: { contains: searchQuery, mode: 'insensitive' } }
                    ]
                  }
                }
              }
            }
          }
        ]
      })
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      avatar: true,
      slug: true,
      views: true,
      createdAt: true,
      type: true,
      year: true,
      _count: {
        select: { links: true, categories: true },
      },
    },
  })

  const username = session.user.username || session.user.email?.split("@")[0] || "user"

  // Only worth computing when browsing everything, not while searching.
  let tidyCount = 0
  if (!searchQuery && linkylinks.length >= 2) {
    const [bundles, dismissed] = await Promise.all([
      prisma.linkLink.findMany({
        where: { userId: session.user.id, type: "NORMAL" },
        include: { links: true, user: { select: { username: true } } },
      }),
      prisma.dismissedRecommendation.findMany({ where: { userId: session.user.id }, select: { linkId: true } }),
    ])
    const hidden = new Set(dismissed.map((d) => d.linkId))
    tidyCount = generateRecommendations(bundles).filter((r) => !hidden.has(r.link.id)).length
  }

  return (
    <>
      <PageHeader title="Bundels">
        <div className="mt-4">
          <DashboardSearch initialValue={searchQuery} />
        </div>
      </PageHeader>

      <main className="mx-auto max-w-2xl space-y-4 px-4">
        {tidyCount > 0 && (
          <Link
            href="/recommendations"
            className="pressable flex items-center gap-3 rounded-3xl bg-tint-soft p-4 text-tint-ink"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface/70">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Tidy up</span>
              <span className="block text-[14px] opacity-80">
                {tidyCount} {tidyCount === 1 ? "link might" : "links might"} fit better in another Bundel
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 opacity-60" />
          </Link>
        )}

        {linkylinks.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-14 text-center shadow-card">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-ink-2">
              {searchQuery ? <Search className="h-7 w-7" /> : <Link2 className="h-7 w-7" />}
            </span>
            <h2 className="mt-4 text-lg font-semibold">{searchQuery ? "Nothing found" : "Your first Bundel"}</h2>
            <p className="mt-1 max-w-xs text-[15px] text-ink-2 text-pretty">
              {searchQuery
                ? `No Bundels or links match “${searchQuery}”.`
                : "Collect a few links, give them a name, and share one page instead of five messages."}
            </p>
            {!searchQuery && (
              <Link href="/create" className={buttonStyles({ className: "mt-6" })}>
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                New Bundel
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-line/50 divide-y divide-line/70">
            {linkylinks.map((linkylink, index) => (
              <LinkylinkCard
                key={linkylink.id}
                index={index}
                title={linkylink.title}
                subtitle={linkylink.subtitle}
                avatar={linkylink.avatar}
                userImage={session.user.image}
                slug={linkylink.slug}
                username={username}
                linkCount={linkylink._count.links}
                views={linkylink.views}
                type={linkylink.type}
                year={linkylink.year}
                categoryCount={linkylink._count.categories}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
