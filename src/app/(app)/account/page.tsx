import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/PageHeader"
import { AccountView } from "./AccountView"
import { optional } from "@/lib/optional"
import { subBundelIds } from "@/lib/sub-bundels"

export const metadata = { title: "You - Bundel" }

/** The website an AI app belongs to (claude.ai, chatgpt.com), for its icon. Null for local apps. */
function appSite(clientId: string, redirectHost: string | null): string | null {
  let host: string | undefined
  try {
    host = clientId.startsWith("https://") ? new URL(clientId).hostname : redirectHost ?? undefined
  } catch {
    return null
  }
  // redirectHost is a bare host only for web redirects; app schemes are stored as "scheme://".
  if (!host || host.includes("/") || !host.includes(".") || /^(localhost|127\.|\[)/.test(host)) return null
  return host.split(":")[0].replace(/^www\./, "")
}

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/account")

  const hiddenIds = await subBundelIds(session.user.id)
  const [user, stats, grants, sites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, name: true, email: true, image: true },
    }),
    prisma.linkLink.aggregate({
      where: { userId: session.user.id, id: { notIn: hiddenIds } },
      _count: true,
      _sum: { views: true },
    }),
    optional(
      prisma.mcpGrant.findMany({
        where: { userId: session.user.id, revokedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, clientName: true, clientId: true, redirectHost: true, bundelId: true, lastUsedAt: true, createdAt: true },
      }),
      []
    ),
    optional(prisma.blockedSite.findMany({ where: { userId: session.user.id }, orderBy: { domain: "asc" }, select: { id: true, domain: true } }), []),
  ])
  const bundelIds = [...new Set(grants.map((g) => g.bundelId).filter((id): id is string => !!id))]
  const titles = bundelIds.length
    ? new Map((await prisma.linkLink.findMany({ where: { id: { in: bundelIds } }, select: { id: true, title: true } })).map((b) => [b.id, b.title]))
    : new Map<string, string>()
  const apps = grants
    .filter((g) => !g.bundelId || titles.has(g.bundelId))
    .map((g) => ({
      id: g.id,
      name: g.clientName,
      site: appSite(g.clientId, g.redirectHost),
      bundelTitle: g.bundelId ? titles.get(g.bundelId) ?? null : null,
      lastUsedAt: g.lastUsedAt?.toISOString() ?? null,
      createdAt: g.createdAt.toISOString(),
    }))
  if (!user) redirect("/login")

  return (
    <>
      <PageHeader title="You" wide />
      <AccountView
        user={user}
        bundelCount={stats._count}
        totalViews={stats._sum.views ?? 0}
        aiApps={apps}
        blockedSites={sites}
      />
    </>
  )
}
