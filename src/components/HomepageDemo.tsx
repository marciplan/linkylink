"use client"

import { useEffect, useState } from "react"
import { BatteryFull, Copy, MoreHorizontal, Share, Signal, Wifi } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { toneProps, type Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"

interface DemoExample {
  title: string
  username: string
  emoji: string
  tone: Tone
  links: { title: string; domain: string; note?: string }[]
}

const examples: DemoExample[] = [
  {
    title: "Which vacation should we book?",
    username: "sarah_travels",
    emoji: "✈️",
    tone: { hue: 255, soft: 0.064, deep: 0.06, ink: "mid", neutral: false },
    links: [
      { title: "Villa in Tuscany", domain: "airbnb.com", note: "Pool + vineyard. My vote." },
      { title: "All-inclusive Maldives resort", domain: "booking.com" },
      { title: "Cozy cabin in Norway", domain: "vrbo.com", note: "Northern lights in March!" },
      { title: "Surf week in Portugal", domain: "surfcamp.pt" },
    ],
  },
  {
    title: "My favorite music videos",
    username: "marciplan",
    emoji: "🎬",
    tone: { hue: 295, soft: 0.064, deep: 0.06, ink: "mid", neutral: false },
    links: [
      { title: "Fred Again - Boiler Room", domain: "youtube.com", note: "The best 60 minutes on YouTube." },
      { title: "Bon Iver at AIR Studios", domain: "youtube.com" },
      { title: "Eric Prydz at Tomorrowland", domain: "soundcloud.com" },
      { title: "Four Tet, Essential Mix", domain: "bbc.co.uk", note: "Headphones on." },
    ],
  },
  {
    title: "Team building activity",
    username: "tech_team",
    emoji: "🎯",
    tone: { hue: 5, soft: 0.085, deep: 0.1, ink: "mid", neutral: false },
    links: [
      { title: "Escape room downtown", domain: "eventbrite.com", note: "Fits 12, Friday afternoons." },
      { title: "Italian cooking class", domain: "cozymeal.com" },
      { title: "Bowling tournament", domain: "yelp.com" },
      { title: "Pottery workshop", domain: "klei.studio", note: "Everyone takes a mug home." },
    ],
  },
]

/** A realistic phone showing a self-playing example Bundel. */
export function HomepageDemo() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % examples.length), 4800)
    return () => clearInterval(t)
  }, [])

  const ex = examples[index]

  return (
    <div className="relative mx-auto w-[300px] sm:w-[320px] lg:w-[340px]" aria-label="Example Bundel" role="img">
      <div
        className="absolute -inset-16 -z-10 rounded-full opacity-35 blur-3xl transition-[background] duration-1000"
        style={{ background: `oklch(0.62 ${ex.tone.deep + 0.05} ${ex.tone.hue})` }}
      />

      {/* Titanium frame with side buttons */}
      <div className="relative rounded-[56px] bg-gradient-to-b from-[#3a3a40] via-[#1b1b1f] to-[#2c2c31] p-[3px] shadow-[0_50px_100px_-30px_rgb(0_0_0/0.55),0_20px_40px_-20px_rgb(0_0_0/0.4)]">
        <span className="absolute -left-[3px] top-[110px] h-8 w-[3px] rounded-l bg-[#2c2c31]" aria-hidden />
        <span className="absolute -left-[3px] top-[168px] h-14 w-[3px] rounded-l bg-[#2c2c31]" aria-hidden />
        <span className="absolute -left-[3px] top-[236px] h-14 w-[3px] rounded-l bg-[#2c2c31]" aria-hidden />
        <span className="absolute -right-[3px] top-[190px] h-20 w-[3px] rounded-r bg-[#2c2c31]" aria-hidden />

        <div className="rounded-[53px] bg-black p-[9px]">
          {/* Screen */}
          <div
            data-tint
            style={{ "--tint-h": ex.tone.hue } as React.CSSProperties}
            className="relative aspect-[9/19.4] overflow-hidden rounded-[44px] bg-bg text-ink"
          >
            {/* Status bar + dynamic island */}
            <div className="absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between px-7 pt-1 text-[12px] font-semibold text-white">
              <span className="tabular-nums">9:41</span>
              <span className="flex items-center gap-1" aria-hidden>
                <Signal className="h-3 w-3" strokeWidth={2.5} />
                <Wifi className="h-3 w-3" strokeWidth={2.5} />
                <BatteryFull className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>
            <div className="absolute left-1/2 top-[11px] z-30 h-[26px] w-[88px] -translate-x-1/2 rounded-full bg-black" aria-hidden />

            {/* Hero */}
            <div className="tone-hero relative px-5 pb-8 pt-[88px] text-left text-white" {...toneProps(ex.tone)}>
              <div className="absolute right-4 top-14 grid h-8 w-8 place-items-center rounded-full bg-black/20 ring-1 ring-white/25">
                <Share className="h-3.5 w-3.5" />
              </div>
              <div key={`h-${index}`} className="relative animate-rise">
                <span className="tone-chip grid h-[52px] w-[52px] place-items-center rounded-[30%]" {...toneProps(ex.tone)}>
                  <FluentEmoji emoji={ex.emoji} size={32} />
                </span>
                <p className="mt-3 text-[23px] font-bold leading-[1.1] tracking-tight text-balance">{ex.title}</p>
                <p className="mt-2 text-[12px] font-medium text-white/75">@{ex.username} · {ex.links.length} links</p>
              </div>
            </div>

            {/* Links */}
            <div className="relative -mt-5 space-y-2 rounded-t-[26px] bg-bg px-3 pb-24 pt-3">
              {ex.links.map((l, i) => (
                <div
                  key={`${index}-${i}`}
                  className="stagger relative flex items-start gap-2.5 rounded-2xl bg-surface p-3 text-left shadow-card ring-1 ring-line/50"
                  style={{ "--i": i + 2 } as React.CSSProperties}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-tint-soft text-xs font-bold text-tint-ink">
                    {l.domain[0].toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 pr-5">
                    <span className="block truncate text-[13.5px] font-semibold">{l.title}</span>
                    <span className="block text-[11px] text-ink-3">{l.domain}</span>
                    {l.note && <span className="mt-1.5 block border-l-2 border-tint/50 pl-2 text-[11.5px] leading-snug text-ink-2">{l.note}</span>}
                  </span>
                  <MoreHorizontal className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-ink-3" />
                </div>
              ))}
            </div>

            {/* Visitor bar and home indicator */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg via-bg/90 to-transparent px-4 pb-6 pt-8">
              <div className="glass flex items-center gap-1.5 rounded-full border border-line/60 p-1 shadow-float">
                <span className="flex h-9 flex-1 items-center justify-center gap-1.5 text-[12.5px] font-semibold text-ink">
                  <Copy className="h-3.5 w-3.5" />
                  Save a copy
                </span>
                <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-tint-strong text-[12.5px] font-semibold text-white">
                  <Share className="h-3.5 w-3.5" />
                  Share
                </span>
              </div>
            </div>
            <div className="absolute bottom-2 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-ink/80" aria-hidden />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-1.5">
        {examples.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show example ${i + 1}`}
            className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/20")}
          />
        ))}
      </div>
    </div>
  )
}
