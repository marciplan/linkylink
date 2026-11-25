import Link from "next/link"
import { ArrowRight, ChevronRight, ChevronUp, LayoutGrid, Plus, Search, Sparkles } from "lucide-react"
import { LinkylinkCard } from "@/components/LinkylinkCard"
import { FluentEmoji } from "@/components/FluentEmoji"
import { BundelLogo } from "@/components/BundelLogo"
import { buttonStyles } from "@/components/ui/button"
import { emojiTone } from "@/lib/emoji-tone"
import { toneProps } from "@/lib/tone"
import { cn } from "@/lib/utils"
import { RotatingHeadline, type HeadlineSet } from "./RotatingHeadline"
import { InView } from "./InView"

// Above the fold: a big headline with Bundel tiles set between the words, then
// the product itself in a soft frame, cut off at the bottom so you scroll on.

const HEADLINE: [string, string][][] = [
  [["✈️", "plans"], ["🎁", "wishlists"], ["🛍️", "finds"]],
  [["🍝", "recipes"], ["🎬", "watchlists"], ["🎧", "songs"]],
  [["🏖️", "trips"], ["🎄", "gift lists"], ["🏷️", "deals"]],
  [["🗳️", "votes"], ["📚", "book lists"], ["📍", "spots"]],
]

export function Hero() {
  return (
    <section className="relative px-5 pb-10 pt-10 text-center md:px-8 md:pt-16">
      <RotatingHeadline
        sets={HEADLINE.map((set) => set.map(([emoji, word]) => ({ emoji, word, tone: emojiTone(emoji) })) as HeadlineSet)}
        className="animate-rise relative mx-auto text-[clamp(2.2rem,0.6rem+6vw,5.6rem)] font-bold leading-[1.08] tracking-[-0.05em]"
      />
      <p className="animate-rise mx-auto mt-7 max-w-xl text-[clamp(1.05rem,0.95rem+0.4vw,1.3rem)] leading-relaxed text-ink-2 text-pretty [animation-delay:80ms]">
        Collect links, decide with friends and let your AI hunt for deals. One beautiful page you can send anywhere.
      </p>
      <div className="animate-rise mt-9 flex flex-col items-center gap-3 [animation-delay:140ms]">
        <span className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/register" className={buttonStyles({ size: "md", className: "h-14 w-full px-7 text-base sm:w-auto" })}>
            Make a Bundel
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/showcase" className={buttonStyles({ variant: "secondary", size: "md", className: "h-14 w-full bg-surface px-7 text-base shadow-card ring-1 ring-line/60 sm:w-auto" })}>
            <LayoutGrid className="h-5 w-5" />
            See Bundels
          </Link>
        </span>
        <span className="text-sm text-ink-3">Free. Takes about a minute.</span>
      </div>
    </section>
  )
}

export interface Screen {
  emoji: string
  title: string
  meta: string
  links: { title: string; domain: string; note?: string; votes?: number; deals?: boolean }[]
}

export const screens: Screen[] = [
  {
    emoji: "🛍️",
    title: "Black Friday",
    meta: "@marciano · 4 links",
    links: [
      { title: "Sony WH-1000XM6", domain: "sony.com", deals: true },
      { title: "Dyson Airwrap", domain: "dyson.com", note: "Only if under € 450" },
      { title: "LEGO Millennium Falcon", domain: "lego.com" },
    ],
  },
  {
    emoji: "✈️",
    title: "Where do we stay in Lisbon?",
    meta: "@sanne asks · 7 votes",
    links: [
      { title: "Casa in Alfama", domain: "airbnb.com", votes: 4 },
      { title: "Beach house in Cascais", domain: "booking.com", votes: 2 },
      { title: "Loft near Time Out Market", domain: "airbnb.com", votes: 1 },
    ],
  },
  {
    emoji: "🎁",
    title: "Gift ideas for Dad",
    meta: "@lotte · 4 links",
    links: [
      { title: "Vintage record player", domain: "bol.com", note: "The wooden one" },
      { title: "Whiskey tasting for two", domain: "smartbox.com" },
      { title: "Golf lesson voucher", domain: "golf.nl", note: "He keeps hinting" },
    ],
  },
]

const domainFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

function Favicon({ domain, size }: { domain: string; size: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-[10px] bg-tint-soft" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative icons */}
      <img src={domainFavicon(domain)} alt="" width={size / 2} height={size / 2} loading="lazy" />
    </span>
  )
}

/** A phone screen showing one Bundel, cut off at the bottom by its tile. */
export function PhoneScreen({ screen }: { screen: Screen }) {
  const tone = emojiTone(screen.emoji)
  return (
    <div className="mx-auto w-[244px] overflow-hidden rounded-t-[34px] bg-bg text-left shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)] ring-1 ring-line/60" data-tint style={{ ["--tint-h" as string]: tone.hue }}>
      <div className="tone-hero relative px-4 pb-6 pt-9 text-white" {...toneProps(tone)}>
        <div className="absolute inset-x-0 top-0 flex h-7 items-center justify-between px-5 text-[9px] font-semibold">
          <span>9:41</span>
          <span className="h-1.5 w-5 rounded-sm bg-white/80" aria-hidden />
        </div>
        <span className="tone-chip grid h-10 w-10 place-items-center rounded-[30%]" {...toneProps(tone)}>
          <FluentEmoji emoji={screen.emoji} size={24} />
        </span>
        <p className="mt-2.5 text-[16px] font-bold leading-tight tracking-tight">{screen.title}</p>
        <p className="mt-1 text-[10px] font-medium text-white/75">{screen.meta}</p>
      </div>
      <div className="relative -mt-3 space-y-1.5 rounded-t-[18px] bg-bg px-2.5 pb-3 pt-2.5">
        {screen.links.map((l) => (
          <div key={l.title} className="rounded-xl bg-surface p-2 shadow-card ring-1 ring-line/50">
            <div className="flex items-center gap-2">
              <Favicon domain={l.domain} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold">{l.title}</span>
                <span className="block text-[9px] text-ink-3">{l.domain}</span>
              </span>
              {l.votes !== undefined && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", l.votes === 4 ? "bg-ink text-bg" : "bg-surface-2 text-ink-2")}>{l.votes}</span>
              )}
            </div>
            {l.note && <p className="ml-9 mt-1 border-l-2 border-tint/50 pl-1.5 text-[9.5px] text-ink-2">{l.note}</p>}
            {l.deals && (
              <div className="ml-9 mt-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-tint-soft px-2 py-0.5 text-[9px] font-semibold text-tint-ink ring-1 ring-tint/30">
                  5 deals found
                  <ChevronUp className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                <div className="mt-1.5 space-y-1 border-l-2 border-line pl-1.5">
                  {[
                    ["Coolblue", "coolblue.nl", "€ 349, free delivery"],
                    ["Bol", "bol.com", "€ 359, tomorrow"],
                  ].map(([name, domain, note]) => (
                    <div key={name} className="flex items-center gap-1.5">
                      <Favicon domain={domain} size={18} />
                      <span className="min-w-0">
                        <span className="block text-[9.5px] font-semibold leading-tight">{name}</span>
                        <span className="block text-[8.5px] text-ink-3">{note}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const shotBundels = [
  { title: "Black Friday", subtitle: "Waiting for these to drop in price", avatar: "🛍️", slug: "black-friday", linkCount: 4, views: 132 },
  { title: "Lisbon, here we come", subtitle: "Where do we stay? Vote for one", avatar: "✈️", slug: "lisbon-trip", linkCount: 7, views: 58 },
  { title: "Gift ideas for Dad", subtitle: "Pick something, tell nobody", avatar: "🎁", slug: "gift-ideas-dad", linkCount: 4, views: 23 },
  { title: "Pasta nights", subtitle: "Six recipes that never fail", avatar: "🍝", slug: "pasta-nights", linkCount: 6, views: 311 },
  { title: "Places to see", subtitle: "Listings we're considering", avatar: "🏡", slug: "places-to-see", linkCount: 4, views: 12 },
  { title: "Songs for the drive", subtitle: "The good ones only", avatar: "🎧", slug: "drive-songs", linkCount: 9, views: 87 },
]

const shotActivity = [
  { emoji: "🗳️", text: <><b>Sanne</b> voted for “Casa in Alfama”</>, bundel: "Lisbon, here we come", ago: "2m", unread: true },
  { emoji: "💡", text: <><b>Joris</b> suggested “Surf camp Ericeira”</>, bundel: "Lisbon, here we come", ago: "1h", unread: true },
  { emoji: "📋", text: <><b>@lotte</b> saved a copy</>, bundel: "Pasta nights", ago: "3h", unread: false },
]

/** The real app, the way you see it once you're in: Bundels on the left, what friends did on the right. */
export function ProductShot() {
  return (
    <section className="mx-auto max-w-6xl px-3 pb-20 md:px-8 lg:pb-28" aria-label="What Bundel looks like">
      <InView threshold={0.1} className="animate-rise overflow-hidden rounded-[36px] bg-surface-2 p-2.5 ring-1 ring-line/50 [animation-delay:120ms] md:rounded-[48px] md:p-10 md:pb-0">
        {/* The app rises into the frame from below */}
        <div
          inert
          className="relative h-[640px] translate-y-[22%] select-none overflow-hidden rounded-[28px] bg-bg opacity-0 shadow-float transition-[transform,opacity] delay-300 duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[inview=true]/inview:translate-y-0 group-data-[inview=true]/inview:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none md:h-[720px] md:rounded-b-none md:rounded-t-[32px]"
        >
          {/* The app's top bar */}
          <div className="flex h-16 items-center gap-2 border-b border-line/60 px-4 md:px-8">
            <span className="mr-4 md:mr-6">
              <BundelLogo className="font-bold" />
            </span>
            <span className="hidden items-center gap-1 md:flex">
              <span className="inline-flex h-9 items-center rounded-full bg-ink/[0.07] px-3.5 text-[14px] font-semibold">Bundels</span>
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold text-ink-2">
                <Sparkles className="h-3.5 w-3.5" />
                Tidy up
              </span>
              <span className="inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-semibold text-ink-2">Account</span>
            </span>
            <span className="ml-auto flex items-center gap-3">
              <span className="hidden h-9 items-center gap-2 rounded-full bg-surface-2 pl-3 pr-2 text-[14px] text-ink-3 lg:inline-flex">
                <Search className="h-3.5 w-3.5" />
                Search
                <kbd className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-ink-2 shadow-sm">⌘K</kbd>
              </span>
              <span className={buttonStyles({ size: "sm" })}>
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                New Bundel
              </span>
              <span className="hidden h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-[14px] font-bold text-white ring-1 ring-line/80 sm:grid">M</span>
            </span>
          </div>

          {/* Page */}
          <div className="px-4 pt-7 md:px-8 md:pt-10">
            <p className="text-display">Bundels</p>
            <div className="relative mt-4">
              <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
              <div className="flex h-11 w-full items-center rounded-xl bg-ink/[0.06] pl-10 text-[16px] text-ink-3">Search Bundels and links</div>
            </div>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="divide-y divide-line/70 overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-line/50 lg:grid lg:grid-cols-2 lg:gap-4 lg:divide-y-0 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:shadow-none lg:ring-0">
                {shotBundels.map((b, i) => (
                  <LinkylinkCard key={b.slug} index={i} username="you" {...b} />
                ))}
              </div>

              <div className="hidden space-y-4 lg:block">
                <section className="rounded-3xl bg-surface shadow-card ring-1 ring-line/50">
                  <p className="px-4 pt-4 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Activity</p>
                  <ul className="divide-y divide-line/70">
                    {shotActivity.map((a) => (
                      <li key={a.bundel + a.ago} className="flex items-start gap-3 px-4 py-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2">
                          <FluentEmoji emoji={a.emoji} size={22} />
                        </span>
                        <span className="min-w-0 flex-1 text-[15px] leading-snug">
                          <span className="line-clamp-2 [&_b]:font-semibold">{a.text}</span>
                          <span className="block truncate text-[13px] text-ink-3">{a.bundel}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-[13px] text-ink-3 tabular-nums">
                          {a.ago}
                          <span className={cn("h-2 w-2 rounded-full", a.unread ? "bg-sky-500" : "bg-transparent")} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                <div className="flex items-center gap-3 rounded-3xl bg-sky-100/80 p-4 text-sky-900 dark:bg-sky-950 dark:text-sky-100">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface/70">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">Tidy up</span>
                    <span className="block text-[14px] opacity-80">3 links might fit better in another Bundel</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 opacity-60" />
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent" />
        </div>
      </InView>
    </section>
  )
}
