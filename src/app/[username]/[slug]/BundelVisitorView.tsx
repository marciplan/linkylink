import Link from "next/link"
import { Link2, Share } from "lucide-react"
import { BundelHero } from "@/components/bundel/BundelHero"
import { LinkRowBody, type BundelLink } from "@/components/bundel/LinkRow"
import { LinkMoreButton } from "@/components/bundel/LinkMoreButton"
import { TopBar } from "@/components/bundel/TopBar"
import { linkRowStyles, topBarButton } from "@/components/bundel/styles"
import { VisitorBar } from "@/components/bundel/VisitorBar"
import { ShareButton } from "@/components/bundel/ShareButton"
import { bundelIcon } from "@/lib/bundel-icon"
import { bundelHue } from "@/lib/theme"

interface BundelVisitorViewProps {
  bundel: {
    id: string
    slug: string
    title: string
    subtitle: string | null
    avatar: string | null
    headerImage: string | null
    user: { username: string; name: string | null; image: string | null }
    links: BundelLink[]
  }
  currentUser: { username: string; image: string | null } | null
  commentCounts: Record<string, number>
  /** Set when the owner is previewing their own page. */
  previewHref?: string
}

/**
 * What visitors see. Rendered on the server: rows are real links (with a ping
 * for click counting), and only small islands — favicons, the per-link sheet
 * and the share bar — hydrate on the client.
 */
export function BundelVisitorView({ bundel, currentUser, commentCounts, previewHref }: BundelVisitorViewProps) {
  const hue = bundelHue(bundel.slug)
  const icon = bundelIcon(bundel.avatar, bundel.user.image, bundel.title)
  const path = `/${bundel.user.username}/${bundel.slug}`
  const loginHref = `/login?callbackUrl=${encodeURIComponent(path)}`
  const owner = { username: bundel.user.username, avatar: bundel.avatar || bundel.user.image }
  const count = bundel.links.length

  return (
    <div data-tint style={{ "--tint-h": hue } as React.CSSProperties} className="min-h-dvh bg-bg">
      <TopBar
        title={bundel.title}
        leading={
          previewHref ? (
            <Link href={previewHref} className={topBarButton}>
              Done
            </Link>
          ) : (
            <Link href="/" className={`${topBarButton} gap-1.5`} aria-label="Bundel home">
              <Link2 className="h-4 w-4" strokeWidth={2.5} />
              <span className="pr-0.5">Bundel</span>
            </Link>
          )
        }
        trailing={
          <ShareButton title={bundel.title} text={bundel.subtitle} className={topBarButton} aria-label="Share this Bundel">
            <Share className="h-[18px] w-[18px]" />
          </ShareButton>
        }
      />

      <BundelHero
        hue={hue}
        headerImage={bundel.headerImage}
        icon={icon}
        title={bundel.title}
        subtitle={bundel.subtitle}
        meta={
          <>
            <span>@{bundel.user.username}</span>
            <span aria-hidden>·</span>
            <span>
              {count} {count === 1 ? "link" : "links"}
            </span>
          </>
        }
      />
      <div id="hero-end" aria-hidden />

      <main className="relative -mt-6 rounded-t-4xl bg-bg pb-36 pt-5">
        <div className="mx-auto max-w-2xl px-4">
          {count === 0 ? (
            <p className="py-16 text-center text-ink-3">Nothing here yet.</p>
          ) : (
            <ol className="space-y-2.5">
              {bundel.links.map((link, i) => (
                <li key={link.id} className="stagger relative" style={{ "--i": i } as React.CSSProperties}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    ping={`/api/links/${link.id}/click`}
                    className={linkRowStyles}
                  >
                    <LinkRowBody link={link} commentCount={commentCounts[link.id] ?? 0} />
                  </a>
                  <LinkMoreButton
                    link={link}
                    owner={owner}
                    currentUser={currentUser}
                    commentCount={commentCounts[link.id] ?? 0}
                    loginHref={loginHref}
                  />
                </li>
              ))}
            </ol>
          )}

          <p className="mt-12 text-center text-sm text-ink-3">
            Curated by @{bundel.user.username} with{" "}
            <Link href="/" className="font-semibold text-ink-2 underline-offset-4 hover:underline">
              Bundel
            </Link>
          </p>
        </div>
      </main>

      {!previewHref && (
        <VisitorBar
          bundelId={bundel.id}
          title={bundel.title}
          subtitle={bundel.subtitle}
          isSignedIn={!!currentUser}
          path={path}
        />
      )}
    </div>
  )
}
