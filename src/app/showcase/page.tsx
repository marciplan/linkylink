import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome"
import { PhoneScreen } from "@/components/landing/Hero"
import { InView } from "@/components/landing/InView"
import { delay, rise } from "@/components/landing/motion"
import { buttonStyles } from "@/components/ui/button"
import { emojiTone } from "@/lib/emoji-tone"
import { SHOWCASE, SHOWCASE_GROUPS, type ShowcaseBundel } from "@/lib/showcase"
import { shareMetadata } from "@/lib/seo"
import { toneProps } from "@/lib/tone"

const TITLE = "Bundel showcase: what people make"
const DESCRIPTION = "Trip votes, gift lists, recipes, playlists and AI-found deals: see what a Bundel looks like, then start your own."

export const metadata: Metadata = {
  title: `${TITLE} - Bundel`,
  description: DESCRIPTION,
  ...shareMetadata({ title: TITLE, description: DESCRIPTION, path: "/showcase" }),
}

/** Sign up, then the create screen with this title filled in. */
function startHref(b: ShowcaseBundel) {
  return `/register?callbackUrl=${encodeURIComponent(`/create?${new URLSearchParams({ title: b.title })}`)}`
}

function ShowcaseCard({ bundel, index }: { bundel: ShowcaseBundel; index: number }) {
  const tone = emojiTone(bundel.emoji)
  return (
    <li className={`group flex flex-col ${rise}`} style={delay(index * 90)}>
      <div className="relative h-[380px] overflow-hidden rounded-[32px] bg-surface-2 pt-8 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1" aria-hidden>
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(70% 60% at 50% 100%, oklch(0.85 0.07 ${tone.hue} / 0.55), transparent 70%)` }} />
        <div className="relative transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-2">
          <PhoneScreen screen={{ emoji: bundel.emoji, title: bundel.title, meta: bundel.meta, links: bundel.links }} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 px-1">
        <span className="tone-hero tone-icon grain grid h-10 w-10 shrink-0 place-items-center rounded-[28%]" {...toneProps(tone)}>
          <FluentEmoji emoji={bundel.emoji} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold">{bundel.title}</span>
          <span className="block text-[13px] text-ink-3">by @{bundel.user}</span>
        </span>
        <Link href={startHref(bundel)} className={buttonStyles({ size: "sm", className: "shrink-0" })}>
          Use this
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </li>
  )
}

export default function ShowcasePage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-bg">
      <SiteHeader />
      <main className="flex-1">
        <section className="px-5 pb-6 pt-12 text-center md:px-8 md:pt-20">
          <h1 className="animate-rise mx-auto max-w-[14ch] text-[clamp(2.5rem,1rem+5.2vw,5.2rem)] font-bold leading-[1.06] tracking-[-0.05em] text-balance">
            See what people Bundel.
          </h1>
          <p className="animate-rise mx-auto mt-6 max-w-xl text-[clamp(1.05rem,0.95rem+0.4vw,1.25rem)] leading-relaxed text-ink-2 text-pretty [animation-delay:80ms]">
            Trip votes, gift lists, recipes and AI-found deals. Find one you like and make it yours in a minute.
          </p>
          <nav className="animate-rise mt-8 flex flex-wrap justify-center gap-2 [animation-delay:140ms]" aria-label="Kinds of Bundels">
            {SHOWCASE_GROUPS.map((g) => (
              <a key={g.name} href={`#${g.name.toLowerCase().replace(/\s+/g, "-")}`} className="pressable rounded-full bg-surface px-4 py-2 text-[14px] font-semibold shadow-card ring-1 ring-line/60 hover:ring-line">
                {g.name}
              </a>
            ))}
          </nav>
        </section>

        {SHOWCASE_GROUPS.map((g) => {
          const items = SHOWCASE.filter((b) => b.group === g.name)
          return (
            <section key={g.name} id={g.name.toLowerCase().replace(/\s+/g, "-")} className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-16 md:px-8">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-[clamp(1.6rem,1.2rem+1.6vw,2.25rem)] font-bold tracking-[-0.03em]">{g.name}</h2>
                <p className="text-[15px] text-ink-3">{g.line}</p>
              </div>
              <InView threshold={0.15}>
                <ul className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((b, i) => (
                    <ShowcaseCard key={b.slug} bundel={b} index={i} />
                  ))}
                </ul>
              </InView>
            </section>
          )
        })}

        <section className="mx-auto max-w-6xl px-5 pb-24 pt-20 text-center md:px-8">
          <h2 className="text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] font-bold tracking-[-0.03em]">Your turn.</h2>
          <p className="mx-auto mt-3 max-w-md text-[17px] text-ink-2">Free, takes about a minute, and your friends never need an account.</p>
          <Link href="/register" className={buttonStyles({ size: "md", className: "mt-8 h-14 px-7 text-base" })}>
            Make a Bundel
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
