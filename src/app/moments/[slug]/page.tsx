import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowRight, ArrowUp, Sparkles } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { BundelMark } from "@/components/BundelLogo"
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome"
import { PhoneScreen, type Screen } from "@/components/landing/Hero"
import { InView } from "@/components/landing/InView"
import { delay, pop, rise } from "@/components/landing/motion"
import { buttonStyles } from "@/components/ui/button"
import { emojiTone } from "@/lib/emoji-tone"
import { MOMENTS, findMoment, type Moment } from "@/lib/moments"
import { shareMetadata } from "@/lib/seo"
import { toneProps } from "@/lib/tone"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return MOMENTS.map((m) => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const moment = findMoment((await params).slug)
  if (!moment) return {}
  const title = `${moment.seoTitle} - Bundel`
  return { title, description: moment.description, ...shareMetadata({ title: moment.seoTitle, description: moment.description, path: `/moments/${moment.slug}` }) }
}

/** Sign up, then the create screen with the title filled in. */
function startHref(moment: Moment) {
  const create = `/create?${new URLSearchParams({ title: moment.bundel.title, subtitle: moment.bundel.subtitle })}`
  return `/register?callbackUrl=${encodeURIComponent(create)}`
}

/** The example Bundel as a phone screen: notes like "5 deals found" and "4 votes" become the real UI. */
function exampleScreen(moment: Moment): Screen {
  return {
    emoji: moment.emoji,
    title: moment.bundel.title,
    meta: `@you · ${moment.example.length} links`,
    links: moment.example.map((l) => {
      if (l.note === "5 deals found") return { title: l.title, domain: l.domain, deals: true }
      const votes = l.note?.match(/^(\d+) votes?$/)
      if (votes) return { title: l.title, domain: l.domain, votes: Number(votes[1]) }
      return { title: l.title, domain: l.domain, note: l.note }
    }),
  }
}

function HeadTile({ emoji }: { emoji: string }) {
  const tone = emojiTone(emoji)
  return (
    <span className="mx-[0.12em] inline-block h-[0.86em] w-[0.86em] -translate-y-[0.04em] -rotate-6 align-middle">
      <span className="tone-hero tone-icon grain grid h-full w-full animate-[tile-in_620ms_cubic-bezier(0.34,1.56,0.64,1)_both] place-items-center rounded-[0.24em] shadow-[0_0.12em_0.3em_-0.08em_rgb(0_0_0/0.35)] [animation-delay:200ms]" {...toneProps(tone)}>
        <FluentEmoji emoji={emoji} size={64} className="!h-[0.56em] !w-[0.56em]" />
      </span>
    </span>
  )
}

const POINT_EMOJI = ["📌", "👥", "✨"]

export default async function MomentPage({ params }: PageProps) {
  const moment = findMoment((await params).slug)
  if (!moment) notFound()
  const tone = emojiTone(moment.emoji)
  const start = startHref(moment)
  const others = MOMENTS.filter((m) => m.slug !== moment.slug)

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-bg">
      <SiteHeader cta={start} />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-5 pb-12 pt-12 text-center md:px-8 md:pt-20">
          <h1 className="animate-rise mx-auto max-w-[16ch] text-[clamp(2.5rem,1rem+5.2vw,5.2rem)] font-bold leading-[1.06] tracking-[-0.05em] text-balance">
            {moment.headline[0]} <HeadTile emoji={moment.emoji} /> {moment.headline[1]}
          </h1>
          <p className="animate-rise mx-auto mt-6 max-w-xl text-[clamp(1.05rem,0.95rem+0.4vw,1.25rem)] leading-relaxed text-ink-2 text-pretty [animation-delay:80ms]">{moment.description}</p>
          <div className="animate-rise mt-9 flex flex-col items-center gap-3 [animation-delay:140ms]">
            <Link href={start} className={buttonStyles({ size: "md", className: "h-14 px-7 text-base" })}>
              Get started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <span className="text-sm text-ink-3">Free. Your friends don&apos;t need an account.</span>
          </div>
        </section>

        {/* The Bundel, and what your AI does with it */}
        <section className="mx-auto max-w-6xl px-3 pb-20 md:px-8" aria-label={`An example ${moment.title}`}>
          <InView className="rounded-[36px] bg-surface-2 p-3 ring-1 ring-line/50 md:rounded-[48px] md:p-10" threshold={0.2}>
            <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-4 md:grid-cols-2 md:gap-6">
              <div className={`relative h-[460px] overflow-hidden rounded-[28px] bg-surface pt-10 md:h-[520px] ${rise}`} aria-hidden>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-40" style={{ background: `radial-gradient(60% 50% at 50% 100%, oklch(0.8 0.08 ${tone.hue} / 0.6), transparent 70%)` }} />
                <div className="relative">
                  <PhoneScreen screen={exampleScreen(moment)} />
                </div>
              </div>

              <div className={`flex h-[460px] flex-col overflow-hidden rounded-[28px] bg-surface shadow-card ring-1 ring-line/50 md:h-[520px] ${rise}`} style={delay(150)} aria-hidden>
                <div className="flex items-center gap-3 border-b border-line/70 px-4 py-3">
                  <span className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </span>
                  <span className="mx-auto text-[13px] font-semibold text-ink-2">Your AI app</span>
                  <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[11px] font-semibold text-ink-2">
                    <BundelMark className="h-3" />
                    Bundel
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5 text-left">
                  <p className={`ml-auto w-fit max-w-[85%] origin-bottom-right rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[14.5px] text-bg ${pop}`} style={delay(500)}>
                    {moment.aiPrompt}
                  </p>
                  <div className="flex items-start gap-2.5">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-orange-400 text-white ${pop}`} style={delay(850)}>
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div className="space-y-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-medium text-ink-2 ${rise}`} style={delay(1000)}>
                        <BundelMark className="h-3" />
                        Saved to {moment.bundel.title}
                      </span>
                      <p className={`text-[14.5px] leading-relaxed text-pretty ${rise}`} style={delay(1250)}>
                        Done. I searched the web and saved the best ones right under the link in your Bundel. Only you can see them.
                      </p>
                      <ul className="space-y-1.5 rounded-2xl bg-surface-2/70 p-2.5 ring-1 ring-line/60">
                        {moment.sites.slice(0, 3).map((site, i) => (
                          <li key={site} className={`flex items-center gap-2.5 rounded-xl bg-surface p-2 shadow-card ${rise}`} style={delay(1500 + i * 150)}>
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-surface-2">
                              {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative favicon */}
                              <img src={`https://www.google.com/s2/favicons?domain=${site}&sz=64`} alt="" width={16} height={16} />
                            </span>
                            <span className="truncate text-[13.5px] font-semibold">{site}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2 rounded-full bg-surface-2 p-1.5 pl-4 ring-1 ring-line/60">
                    <span className="flex-1 text-[14px] text-ink-3">Reply…</span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-bg">
                      <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </InView>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
          <h2 className="text-center text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] font-bold tracking-[-0.03em]">Why a Bundel</h2>
          <InView>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {moment.points.map((point, i) => {
                const t = emojiTone(POINT_EMOJI[i] ?? "✨")
                return (
                  <li key={point} className={`flex flex-col items-center rounded-[32px] bg-surface-2 px-6 pb-9 pt-10 text-center ${rise}`} style={delay(i * 120)}>
                    <span className="tone-hero tone-icon grain grid h-16 w-16 place-items-center rounded-[28%] shadow-[0_18px_32px_-14px_rgb(0_0_0/0.45)]" {...toneProps(t)}>
                      <FluentEmoji emoji={POINT_EMOJI[i] ?? "✨"} size={36} />
                    </span>
                    <p className="mt-5 max-w-[26ch] text-[17px] font-medium leading-snug text-pretty">{point}</p>
                  </li>
                )
              })}
            </ul>
          </InView>
        </section>

        {/* More */}
        <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
          <h2 className="text-center text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] font-bold tracking-[-0.03em]">More moments</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((m) => {
              const t = emojiTone(m.emoji)
              return (
                <li key={m.slug}>
                  <Link href={`/moments/${m.slug}`} className="pressable group flex h-full flex-col items-center rounded-[28px] bg-surface-2 px-5 pb-6 pt-8 text-center ring-1 ring-transparent transition-shadow hover:ring-line">
                    <span className="tone-hero tone-icon grain grid h-16 w-16 place-items-center rounded-[28%] shadow-[0_18px_32px_-14px_rgb(0_0_0/0.45)] transition-transform group-hover:-rotate-6 group-hover:scale-105" {...toneProps(t)}>
                      <FluentEmoji emoji={m.emoji} size={36} />
                    </span>
                    <span className="mt-5 text-[18px] font-semibold tracking-tight">{m.title}</span>
                    <span className="mt-1 flex-1 text-[14px] text-ink-3 text-pretty">{m.line}</span>
                    <span className={cn(buttonStyles({ size: "sm", className: "mt-5" }))}>
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
