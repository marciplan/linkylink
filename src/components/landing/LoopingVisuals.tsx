"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { ArrowUp, Check, ClipboardPaste, Inbox, Search, Share2, Sparkles } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { BundelMark } from "@/components/BundelLogo"
import { toneProps, type Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"

// Feature-card visuals that keep playing: each loops through a few states on
// a timer. Tones are computed on the server and passed in. All of them stop
// on prefers-reduced-motion and show their first state.

function useTicker(count: number, ms: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setI((v) => (v + 1) % count), ms)
    return () => clearInterval(t)
  }, [count, ms])
  return i
}

const noSubscribe = () => () => {}

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

// --- Its own look: one Bundel, three themes, colours morphing ------------------------

export interface Theme {
  emoji: string
  title: string
  meta: string
  rows: { title: string; domain: string }[]
  tone: Tone
}

export function ThemeCycler({ themes }: { themes: Theme[] }) {
  const i = useTicker(themes.length, 2800)
  const t = themes[i]
  return (
    <div className="tone-morph absolute inset-x-6 -bottom-6 overflow-hidden rounded-t-[22px] bg-bg text-left shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)] ring-1 ring-line/60" data-tint style={{ ...toneProps(t.tone).style, ["--tint-h" as string]: t.tone.hue }}>
      <div className="tone-hero relative flex items-end gap-3 px-5 pb-6 pt-10 text-white" data-ink={t.tone.ink}>
        <span key={t.emoji} className="tone-chip grid h-11 w-11 animate-[tile-in_520ms_cubic-bezier(0.34,1.56,0.64,1)_both] place-items-center rounded-[30%]" data-ink={t.tone.ink}>
          <FluentEmoji emoji={t.emoji} size={26} />
        </span>
        <span key={t.title} className="animate-[word-in_480ms_cubic-bezier(0.23,1,0.32,1)_both] whitespace-nowrap">
          <span className="block text-[17px] font-bold tracking-tight">{t.title}</span>
          <span className="block text-[11px] text-white/75">{t.meta}</span>
        </span>
        <span className="absolute right-4 top-3.5 flex items-center gap-1 text-[10px] font-semibold text-white/85">
          <BundelMark className="mark-tone h-3" />
          bundel.link
        </span>
      </div>
      <div className="-mt-3 space-y-1.5 rounded-t-[16px] bg-bg p-2.5">
        {t.rows.map((r, n) => (
          <div key={`${t.emoji}-${r.title}`} className="flex animate-[word-in_480ms_cubic-bezier(0.23,1,0.32,1)_both] items-center gap-2 rounded-xl bg-surface p-2 shadow-card ring-1 ring-line/50" style={{ animationDelay: `${120 + n * 90}ms` }}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-tint-soft">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative favicon */}
              <img src={favicon(r.domain)} alt="" width={14} height={14} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold leading-tight">{r.title}</span>
              <span className="block text-[9.5px] text-ink-3">{r.domain}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Vote together: votes keep coming in --------------------------------------------

const VOTE_ROWS = [
  { title: "Casa in Alfama", domain: "airbnb.com", start: 3 },
  { title: "Beach house in Cascais", domain: "booking.com", start: 2 },
  { title: "Loft near Time Out Market", domain: "airbnb.com", start: 1 },
]
// Who votes next, in order; then it starts over.
const VOTE_SCRIPT = [0, 1, 0, 2, 1, 0]

export function VoteTicker({ tone }: { tone: Tone }) {
  const step = useTicker(VOTE_SCRIPT.length + 2, 1600)
  const counts = VOTE_ROWS.map((r, i) => r.start + VOTE_SCRIPT.slice(0, Math.min(step, VOTE_SCRIPT.length)).filter((v) => v === i).length)
  const total = counts.reduce((a, b) => a + b, 0)
  const lead = counts.indexOf(Math.max(...counts))
  const last = step > 0 && step <= VOTE_SCRIPT.length ? VOTE_SCRIPT[step - 1] : -1
  return (
    <div className="absolute -bottom-16 w-[260px] overflow-hidden rounded-t-[30px] bg-bg text-left shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)] ring-1 ring-line/60">
      <div className="tone-hero px-4 pb-6 pt-7 text-white" {...toneProps(tone)}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">@sanne asks</p>
        <p className="mt-0.5 text-[16px] font-bold leading-tight tracking-tight">Where do we stay in Lisbon?</p>
        <p className="mt-1 text-[10px] text-white/75 tabular-nums">{total} votes</p>
      </div>
      <div className="-mt-3 space-y-1.5 rounded-t-[18px] bg-bg px-2.5 pb-3 pt-2.5">
        {VOTE_ROWS.map((r, i) => (
          <div key={r.title} className={cn("rounded-xl bg-surface p-2 shadow-card ring-1 transition-[box-shadow] duration-300", i === last ? "ring-sky-400/70" : "ring-line/50")}>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative favicon */}
                <img src={favicon(r.domain)} alt="" width={14} height={14} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{r.title}</span>
              <span key={`${i}-${counts[i]}`} className={cn("animate-[tile-in_420ms_cubic-bezier(0.34,1.56,0.64,1)_both] rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums", i === lead ? "bg-ink text-bg" : "bg-surface-2 text-ink-2")}>
                {counts[i]}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-ink transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: `${(counts[i] / 8) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Great in the chat: a looping conversation with a real-looking link preview -----

export function ChatLoop({ tone }: { tone: Tone }) {
  // 0 question · 1 typing · 2 link preview · 3 reply · 4 hold (then start over)
  const step = useTicker(7, 1100)
  const shown = (n: number) => step >= n
  const bubble = "w-fit rounded-3xl px-3.5 py-2 text-[13px] shadow-card transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
  return (
    <div className="flex h-[250px] w-full max-w-[290px] flex-col justify-center space-y-2.5 text-left">
      <p className={cn(bubble, "origin-bottom-left rounded-bl-lg bg-surface", shown(0) ? "scale-100 opacity-100" : "scale-75 opacity-0")}>Which one should we see first?</p>

      {step === 1 ? (
        <span className="ml-auto flex w-fit gap-1 rounded-3xl rounded-br-lg bg-emerald-100 px-3.5 py-3 shadow-card dark:bg-emerald-950" aria-hidden>
          {[0, 1, 2].map((d) => (
            <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-700/60" style={{ animationDelay: `${d * 120}ms` }} />
          ))}
        </span>
      ) : (
        <div className={cn("ml-auto w-[240px] origin-bottom-right rounded-3xl rounded-br-lg bg-emerald-100 p-1.5 shadow-card transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:bg-emerald-950", shown(2) ? "scale-100 opacity-100" : "scale-75 opacity-0")}>
          {/* A mini version of the real share image */}
          <div className="overflow-hidden rounded-2xl bg-surface">
            <div className="tone-hero grain relative flex aspect-[1.91/1] items-center gap-2 p-2.5" {...toneProps(tone)} style={{ ...toneProps(tone).style, ["--tint-h" as string]: tone.hue }}>
              <div className="flex min-w-0 flex-1 flex-col text-white">
                <span className="tone-chip grid h-7 w-7 place-items-center rounded-[30%]" data-ink={tone.ink}>
                  <FluentEmoji emoji="🏡" size={16} />
                </span>
                <span className="mt-1.5 text-[7px] font-semibold text-white/80">@fleur</span>
                <span className="text-[12px] font-extrabold leading-tight tracking-tight">Places to see</span>
                <span className="mt-0.5 text-[7px] text-white/75">4 links · our notes</span>
              </div>
              <div className="w-[48%] space-y-1 rounded-lg bg-white p-1.5 shadow-lg">
                {["funda.nl", "pararius.nl", "jaap.nl"].map((d, n) => (
                  <div key={d} className="flex items-center gap-1">
                    <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded bg-emerald-50 text-[6px] font-bold text-emerald-900">{["F", "P", "J"][n]}</span>
                    <span className="truncate text-[6.5px] font-semibold text-[#15161c]">{["3-room flat", "Corner house", "Garden flat"][n]}</span>
                  </div>
                ))}
              </div>
              <span className="absolute bottom-1.5 left-2.5 flex items-center gap-0.5 text-[6.5px] font-bold text-white/90">
                <BundelMark className="mark-tone h-2" />
                bundel.link
              </span>
            </div>
            <div className="px-2.5 py-1.5">
              <p className="text-[11.5px] font-semibold leading-tight">Places to see</p>
              <p className="text-[10px] text-ink-3">bundel.link</p>
            </div>
          </div>
          <p className="px-1.5 pb-0.5 pt-1.5 text-[12.5px] text-emerald-950 dark:text-emerald-50">I made a Bundel, vote!</p>
        </div>
      )}

      <p className={cn(bubble, "origin-bottom-left rounded-bl-lg bg-surface", shown(3) ? "scale-100 opacity-100" : "scale-75 opacity-0")}>The corner house! 😍</p>
    </div>
  )
}

// --- Rank your year: cycles through categories --------------------------------------

export interface YearCategory {
  emoji: string
  name: string
  picks: string[]
  tone: Tone
}

export function YearCycler({ categories }: { categories: YearCategory[] }) {
  const i = useTicker(categories.length, 3000)
  const c = categories[i]
  return (
    <div className="absolute -bottom-10">
      <div className="tone-hero tone-morph grain w-[210px] rounded-[26px] p-5 pb-14 text-left text-white shadow-[0_30px_60px_-24px_rgb(0_0_0/0.5)]" {...toneProps(c.tone)}>
        <span key={c.emoji} className="tone-chip grid h-10 w-10 animate-[tile-in_520ms_cubic-bezier(0.34,1.56,0.64,1)_both] place-items-center rounded-[30%]" data-ink={c.tone.ink}>
          <FluentEmoji emoji={c.emoji} size={24} />
        </span>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/70">My 2026 in</p>
        <p key={c.name} className="animate-[word-in_480ms_cubic-bezier(0.23,1,0.32,1)_both] text-[22px] font-bold leading-tight tracking-tight">{c.name}</p>
        <ol className="mt-3 space-y-2">
          {c.picks.map((p, n) => (
            <li key={`${c.name}-${p}`} className="flex animate-[word-in_480ms_cubic-bezier(0.23,1,0.32,1)_both] items-center gap-2 text-[13px] font-semibold" style={{ animationDelay: `${150 + n * 110}ms` }}>
              <FluentEmoji emoji={["🥇", "🥈", "🥉"][n]} size={18} />
              {p}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// --- Save from anywhere: a highlight walks across the ways in ------------------------

const WAYS = [
  { icon: Share2, label: "Share sheet" },
  { icon: ClipboardPaste, label: "Paste anywhere" },
  { icon: Sparkles, label: "Ask your AI" },
  { icon: Inbox, label: "Pocket import" },
]

export function ToolbarSpotlight() {
  const i = useTicker(WAYS.length, 1700)
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center gap-1 rounded-full bg-surface p-1.5 shadow-card ring-1 ring-line/50">
        <span className="absolute left-1.5 top-1.5 h-11 w-11 rounded-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]" style={{ transform: `translateX(${i * 48}px)` }} />
        {WAYS.map(({ icon: Icon, label }, n) => (
          <span key={label} className={cn("relative grid h-11 w-11 place-items-center rounded-full transition-colors duration-300", n === i ? "text-bg" : "text-ink")}>
            <Icon className="h-5 w-5" />
          </span>
        ))}
      </div>
      <span key={WAYS[i].label} className="animate-[word-in_420ms_cubic-bezier(0.23,1,0.32,1)_both] rounded-full bg-surface px-3 py-1 text-[13px] font-semibold shadow-card ring-1 ring-line/50">
        {WAYS[i].label}
      </span>
    </div>
  )
}

// --- Moment cards: distinct site icons, swapped one at a time -------------------------

/**
 * Sites whose favicon is a full tile (its own background to the edge), with that
 * background colour. The circle takes that colour around the icon, so KLM reads as KLM blue. Logos
 * on a transparent background (Google, IKEA, Pinterest…) stay small on white.
 */
const FULL_TILE: Record<string, string> = {
  "airbnb.com": "#ff5a5f", "apple.com": "#ffffff", "bol.com": "#0000a4", "booking.com": "#003b95",
  "canva.com": "#7d2ae8", "coolblue.nl": "#0090e3", "dyson.com": "#000000", "etsy.com": "#f56400",
  "funda.nl": "#ffffff", "getyourguide.com": "#ff5533", "hema.nl": "#e81111", "huispedia.nl": "#9aff7d",
  "instagram.com": "#e1306c", "kadaster.nl": "#ffffff", "klm.com": "#00a1de", "lego.com": "#e3000b",
  "marktplaats.nl": "#eda566", "moomin.com": "#ffffff", "ns.nl": "#ffc917", "pararius.com": "#ffffff",
  "rituals.com": "#58514b", "smartbox.com": "#fa4800", "sony.com": "#000000", "spotify.com": "#1ed760",
  "thefork.com": "#82ff6e", "theknot.com": "#ff44cb", "tripadvisor.com": "#00eb5b",
}

export function IconCycle({ domains, slots = 4 }: { domains: string[]; slots?: number }) {
  const [shown, setShown] = useState(() => domains.slice(0, slots))
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || domains.length <= slots) return
    let next = slots
    let slot = 0
    const t = setInterval(() => {
      const domain = domains[next % domains.length]
      setShown((s) => (s.includes(domain) ? s : s.map((d, n) => (n === slot ? domain : d))))
      next++
      slot = (slot + 1) % slots
    }, 1400)
    return () => clearInterval(t)
  }, [domains, slots])
  return (
    <span className="flex -space-x-2" aria-hidden>
      {shown.map((d, n) => (
        <span key={n} className="h-8 w-8 overflow-hidden rounded-full bg-white shadow-[0_0_0_2px_rgb(255_255_255/0.25)]">
          {/* Keyed by site, so a swap pops in with its own colour */}
          <span key={d} className="grid h-full w-full animate-[tile-in_480ms_cubic-bezier(0.34,1.56,0.64,1)_both] place-items-center" style={{ background: FULL_TILE[d] ?? "#fff" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative favicons */}
            <img src={favicon(d)} alt="" width={FULL_TILE[d] ? 22 : 18} height={FULL_TILE[d] ? 22 : 18} />
          </span>
        </span>
      ))}
    </span>
  )
}

// --- The AI section: a full request, played on a loop ---------------------------------

const DEALS = [
  { title: "Coolblue", domain: "coolblue.nl", note: "€ 349, free next-day delivery" },
  { title: "Bol", domain: "bol.com", note: "€ 359, delivered tomorrow" },
  { title: "MediaMarkt", domain: "mediamarkt.nl", note: "€ 369, pick up today" },
]

// How long each step stays before the next one appears (ms).
const CHAT_STEPS = [900, 1300, 3200, 1300, 1600, 900, 4200]

function AiAvatar() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-orange-400 text-white">
      <Sparkles className="h-4 w-4" />
    </span>
  )
}

const enter = "animate-[word-in_520ms_cubic-bezier(0.23,1,0.32,1)_both]"

/**
 * You ask for deals, the AI searches and asks to save them, you say yes, it
 * calls Bundel over MCP, and the result lands in your Bundel. Then it starts over.
 */
export function AiChatLoop() {
  const reduced = useSyncExternalStore(
    noSubscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (reduced) return
    const t = setTimeout(() => setTick((s) => (s + 1) % (CHAT_STEPS.length + 1)), CHAT_STEPS[tick] ?? 600)
    return () => clearTimeout(t)
  }, [tick, reduced])
  // With reduced motion the whole conversation simply shows, finished.
  const step = reduced ? CHAT_STEPS.length - 1 : tick
  const at = (n: number) => step >= n

  return (
    <div className="overflow-hidden rounded-[28px] bg-surface text-ink shadow-float ring-1 ring-black/5">
      <div className="flex items-center gap-3 border-b border-line/70 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
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

      {/* Messages stick to the bottom, so older ones scroll up and out like a real chat */}
      <div className="flex h-[470px] flex-col justify-end gap-4 overflow-hidden px-4 pb-2 pt-5 md:px-5">
        {at(0) && (
          <p key={`q-${step === 0}`} className={`ml-auto w-fit max-w-[85%] shrink-0 rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[14.5px] text-bg ${enter}`}>
            Find deals for the Sony headphones in my Black Friday list
          </p>
        )}

        {step === 1 && (
          <div className={`flex shrink-0 items-center gap-2.5 ${enter}`}>
            <AiAvatar />
            <span className="flex gap-1 rounded-full bg-surface-2 px-3 py-2.5">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: `${d * 120}ms` }} />
              ))}
            </span>
          </div>
        )}

        {at(2) && (
          <div className={`flex shrink-0 items-start gap-2.5 ${enter}`}>
            <AiAvatar />
            <div className="min-w-0 flex-1 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-medium text-ink-2">
                <Search className="h-3 w-3" />
                Searched 14 shops
              </span>
              <p className="text-[14.5px] leading-relaxed">Found 5 good ones. Coolblue is cheapest at € 349 with free delivery:</p>
              <ul className="space-y-1.5 rounded-2xl bg-surface-2/70 p-3 ring-1 ring-line/60">
                {DEALS.map((d) => (
                  <li key={d.title} className="flex items-center gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px] bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative favicon */}
                      <img src={favicon(d.domain)} alt="" width={14} height={14} />
                    </span>
                    <span className="text-[13px] font-semibold">{d.title}</span>
                    <span className="truncate text-[12px] text-ink-3">{d.note}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[14.5px] leading-relaxed">Want me to save them to your Bundel?</p>
            </div>
          </div>
        )}

        {at(3) && (
          <p className={`ml-auto w-fit shrink-0 rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[14.5px] text-bg ${enter}`}>Yes, save them</p>
        )}

        {at(4) && (
          <div className={`flex shrink-0 items-start gap-2.5 ${enter}`}>
            <AiAvatar />
            <div className="min-w-0 flex-1 space-y-2.5">
              {/* The MCP tool call */}
              <div className="rounded-2xl bg-surface-2/70 p-3 ring-1 ring-line/60">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold">
                  <span className="grid h-6 w-6 place-items-center rounded-[8px] bg-surface shadow-card">
                    <BundelMark className="h-3.5" />
                  </span>
                  Bundel
                  <span className="font-mono text-[11.5px] font-normal text-ink-3">save_results</span>
                  <span className="ml-auto">
                    {at(5) ? (
                      <span className="grid h-5 w-5 animate-[tile-in_420ms_cubic-bezier(0.34,1.56,0.64,1)_both] place-items-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink" />
                    )}
                  </span>
                </div>
                <p className="mt-1.5 pl-8 font-mono text-[11px] text-ink-3">{at(5) ? "Saved 5 links under “Sony WH-1000XM6”" : "Saving 5 links to Black Friday…"}</p>
              </div>

              {at(6) && (
                <div className={`space-y-2.5 ${enter}`}>
                  <p className="text-[14.5px] leading-relaxed">Done! They&apos;re under the headphones in your Black Friday Bundel. Only you can see them.</p>
                  <div className="rounded-2xl bg-surface p-3 shadow-card ring-1 ring-line/60">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-sky-50">
                        {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative favicon */}
                        <img src={favicon("sony.com")} alt="" width={18} height={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold">Sony WH-1000XM6</span>
                        <span className="block text-[12px] text-ink-3">bundel.link/you/black-friday</span>
                      </span>
                    </div>
                    <span className="ml-[46px] mt-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-sky-100 px-2.5 text-[12px] font-semibold text-sky-900 ring-1 ring-sky-300/60 dark:bg-sky-950 dark:text-sky-100">
                      5 deals found
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 md:px-5">
        <div className="flex items-center gap-2 rounded-full bg-surface-2 p-1.5 pl-4 ring-1 ring-line/60">
          <span className="flex-1 text-[14px] text-ink-3">Reply…</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-bg">
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  )
}
