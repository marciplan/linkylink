"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { BundelMark } from "@/components/BundelLogo"
import { toneProps, type Tone } from "@/lib/tone"

export interface Mood {
  emoji: string
  keywords: string[]
  tone: Tone
  /** Example links shown in the preview. */
  links: string[]
}

const PICKS = ["Lisbon trip", "Gift ideas for Mum", "Black Friday", "Pasta nights"]

/** "Make your first Bundel": name it and watch it take shape, then carry the name into sign-up. */
export function StartBundel({ moods, fallback }: { moods: Mood[]; fallback: Mood }) {
  const [name, setName] = useState("")
  const lower = name.toLowerCase()
  const mood = moods.find((m) => m.keywords.some((k) => lower.includes(k))) ?? fallback
  const title = name.trim() || "Your first Bundel"
  const create = `/create?${new URLSearchParams(name.trim() ? { title: name.trim() } : {})}`
  const href = `/register?callbackUrl=${encodeURIComponent(create)}`

  return (
    <div className="tone-hero grain relative overflow-hidden rounded-[40px] px-6 py-14 text-white shadow-float transition-[background] duration-500 md:px-14 md:py-16" {...toneProps(mood.tone)}>
      <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-[clamp(2rem,1.2rem+3vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.035em] text-balance">Make your first Bundel</h2>
          <p className="mt-3 max-w-md text-[17px] text-white/80 text-pretty">Give it a name and watch it take shape. Add links once you&apos;re in.</p>

          <form
            className="mt-7 flex max-w-md items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.5)]"
            onSubmit={(e) => {
              e.preventDefault()
              window.location.href = href
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Name your Bundel…"
              aria-label="Name your Bundel"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-3"
            />
            <Link href={href} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 text-[15px] font-semibold text-bg transition-transform hover:scale-[1.03]">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {PICKS.map((p) => (
              <button key={p} type="button" onClick={() => setName(p)} className="pressable rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-white ring-1 ring-white/25 hover:bg-white/25">
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="mx-auto w-full max-w-[340px]" aria-hidden>
          <div className="overflow-hidden rounded-[30px] bg-bg text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/20">
            <div className="tone-hero grain relative px-5 pb-7 pt-9 text-white" {...toneProps(mood.tone)}>
              <span className="absolute right-4 top-3.5 flex items-center gap-1 text-[11px] font-semibold text-white/85" style={{ ["--tint-h" as string]: mood.tone.hue }}>
                <BundelMark className="mark-tone h-3.5" />
                bundel.link
              </span>
              <span key={mood.emoji} className="tone-chip grid h-14 w-14 animate-[tile-in_520ms_cubic-bezier(0.34,1.56,0.64,1)_both] place-items-center rounded-[30%]" {...toneProps(mood.tone)}>
                <FluentEmoji emoji={mood.emoji} size={34} />
              </span>
              <p className="mt-4 truncate text-[22px] font-bold tracking-tight">{title}</p>
              <p className="mt-1 text-[12px] text-white/75">@you · {mood.links.length} links</p>
            </div>
            <div className="-mt-4 space-y-2 rounded-t-[22px] bg-bg p-3">
              {mood.links.map((l, i) => (
                <div key={`${mood.emoji}-${l}`} className="flex animate-[word-in_480ms_cubic-bezier(0.23,1,0.32,1)_both] items-center gap-2.5 rounded-2xl bg-surface p-2.5 shadow-card ring-1 ring-line/50" style={{ animationDelay: `${i * 90}ms` }}>
                  <span className="h-8 w-8 rounded-[10px] bg-surface-2" />
                  <span className="text-[13.5px] font-semibold">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
