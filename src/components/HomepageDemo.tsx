"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Share } from "lucide-react"
import { bundelGradient } from "@/lib/theme"
import { cn } from "@/lib/utils"

interface DemoExample {
  title: string
  username: string
  emoji: string
  hue: number
  links: { title: string; domain: string; note?: string }[]
}

const examples: DemoExample[] = [
  {
    title: "Which vacation should we book?",
    username: "sarah_travels",
    emoji: "✈️",
    hue: 220,
    links: [
      { title: "Villa in Tuscany", domain: "airbnb.com", note: "Pool + vineyard. My vote." },
      { title: "All-inclusive Maldives resort", domain: "booking.com" },
      { title: "Cozy cabin in Norway", domain: "vrbo.com", note: "Northern lights in March!" },
    ],
  },
  {
    title: "My favorite music videos",
    username: "marciplan",
    emoji: "🎵",
    hue: 330,
    links: [
      { title: "Fred Again - Boiler Room", domain: "youtube.com", note: "The best 60 minutes on YouTube." },
      { title: "Bon Iver at AIR Studios", domain: "youtube.com" },
      { title: "Eric Prydz at Tomorrowland", domain: "soundcloud.com" },
    ],
  },
  {
    title: "Team building activity",
    username: "tech_team",
    emoji: "🎯",
    hue: 150,
    links: [
      { title: "Escape room downtown", domain: "eventbrite.com", note: "Fits 12, Friday afternoons." },
      { title: "Italian cooking class", domain: "cozymeal.com" },
      { title: "Bowling tournament", domain: "yelp.com" },
    ],
  },
]

/** A phone-sized, self-playing preview of a Bundel page. */
export function HomepageDemo() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % examples.length), 4200)
    return () => clearInterval(t)
  }, [])

  const ex = examples[index]

  return (
    <div className="relative mx-auto w-full max-w-[320px]" aria-label="Example Bundel" role="img">
      <div className="absolute -inset-10 -z-10 rounded-full opacity-40 blur-3xl transition-[background] duration-700" style={{ background: bundelGradient(ex.hue) }} />
      <div className="overflow-hidden rounded-[44px] border-[6px] border-ink bg-bg shadow-float">
        <div
          data-tint
          style={{ "--tint-h": ex.hue } as React.CSSProperties}
          className="relative"
        >
          <div className="relative px-5 pb-9 pt-14 text-left text-white transition-[background] duration-700" style={{ background: bundelGradient(ex.hue) }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/40" />
            <div className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/20 ring-1 ring-white/25">
              <Share className="h-3.5 w-3.5" />
            </div>
            <div key={`h-${index}`} className="relative animate-rise">
              <span className="grid h-12 w-12 place-items-center rounded-[30%] bg-white/25 text-2xl ring-1 ring-white/50 backdrop-blur">{ex.emoji}</span>
              <p className="mt-3 text-[22px] font-bold leading-tight tracking-tight text-balance">{ex.title}</p>
              <p className="mt-2 text-xs font-medium text-white/80">@{ex.username} · {ex.links.length} links</p>
            </div>
          </div>
          <div className="relative -mt-5 space-y-2 rounded-t-[24px] bg-bg px-3 pb-5 pt-3">
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
                  <span className="block truncate text-[13px] font-semibold">{l.title}</span>
                  <span className="block text-[11px] text-ink-3">{l.domain}</span>
                  {l.note && <span className="mt-1.5 block border-l-2 border-tint/50 pl-2 text-[11.5px] leading-snug text-ink-2">{l.note}</span>}
                </span>
                <MoreHorizontal className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-ink-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-1.5">
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
