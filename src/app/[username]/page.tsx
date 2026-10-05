import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Link2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { emailEnabled } from "@/lib/email"
import { Avatar } from "@/components/Avatar"
import { LinkylinkCard } from "@/components/LinkylinkCard"
import { buttonStyles } from "@/components/ui/button"
import { ProfileActions } from "./ProfileActions"

interface PageProps {
  params: Promise<{ username: string }>
}

async function getProfile(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      linkylinks: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, subtitle: true, avatar: true, slug: true, views: true, type: true, year: true,
          _count: { select: { links: true, categories: true } },
        },
      },
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const user = await prisma.user.findUnique({ where: { username }, select: { name: true, _count: { select: { linkylinks: true } } } })
  if (!user) return {}
  const name = user.name || `@${username}`
  return {
    title: `${name} (@${username}) - Bundel`,
    description: `${user._count.linkylinks} link collections by ${name}.`,
    alternates: { canonical: `/${username}`, types: { "application/rss+xml": `/${username}/feed.xml` } },
  }
}

/** A curator's public page: the thing people put in their bio. */
export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params
  const [user, session] = await Promise.all([getProfile(username), auth()])
  if (!user) notFound()

  const displayName = user.name || `@${user.username}`
  const isMe = session?.user?.id === user.id
  const linkCount = user.linkylinks.reduce((n, b) => n + b._count.links, 0)

  return (
    <div className="min-h-dvh bg-bg pb-safe">
      <header className="pt-safe">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href={isMe ? "/dashboard" : "/"} className="pressable inline-flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-bg">
              <Link2 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Bundel
          </Link>
          {isMe && (
            <Link href="/dashboard" className={buttonStyles({ variant: "ghost", size: "sm" })}>
              Your Bundels
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4">
        <section className="animate-rise px-1 pb-6 pt-4">
          <Avatar src={user.image} username={user.username} size={80} />
          <h1 className="mt-4 text-display text-balance">{displayName}</h1>
          <p className="mt-1 text-[15px] text-ink-2">
            @{user.username} · {user.linkylinks.length} {user.linkylinks.length === 1 ? "Bundel" : "Bundels"} · {linkCount}{" "}
            {linkCount === 1 ? "link" : "links"}
          </p>
          {!isMe && <ProfileActions username={user.username} displayName={displayName} emailEnabled={emailEnabled()} />}
        </section>

        {user.linkylinks.length === 0 ? (
          <p className="rounded-3xl bg-surface px-6 py-12 text-center text-ink-2 shadow-card">No public Bundels yet.</p>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-line/50 divide-y divide-line/70">
            {user.linkylinks.map((b, i) => (
              <LinkylinkCard
                key={b.id}
                index={i}
                title={b.title}
                subtitle={b.subtitle}
                avatar={b.avatar}
                userImage={user.image}
                slug={b.slug}
                username={user.username}
                linkCount={b._count.links}
                views={b.views}
                type={b.type}
                year={b.year}
                categoryCount={b._count.categories}
              />
            ))}
          </div>
        )}

        <p className="py-10 text-center text-sm text-ink-3">
          Made with{" "}
          <Link href="/" className="font-semibold text-ink-2 underline-offset-4 hover:underline">
            Bundel
          </Link>
        </p>
      </main>
    </div>
  )
}
