"use client"

import { useEffect, useRef, useState } from "react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { toneProps, type Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"

export interface HeadlineSlot {
  emoji: string
  word: string
  tone: Tone
}

/** Each set fills the three slots of "Where [1], [2] and [3] come together." */
export type HeadlineSet = [HeadlineSlot, HeadlineSlot, HeadlineSlot]

const TILTS = ["-rotate-6", "rotate-3", "-rotate-3"]
const INTERVAL_MS = 3200
const STAGGER_MS = 140

/** A Bundel tile sized to the text around it. Re-keyed on change so it pops in. */
function Tile({ slot, index, delay }: { slot: HeadlineSlot; index: number; delay: number }) {
  return (
    <span className={cn("ml-[0.1em] mr-[0.16em] inline-block h-[0.86em] w-[0.86em] -translate-y-[0.04em] align-middle transition-transform duration-300 ease-out hover:rotate-0 hover:scale-110", TILTS[index])}>
      <span
        key={slot.emoji}
        className="tone-hero tone-icon grain grid h-full w-full animate-[tile-in_520ms_cubic-bezier(0.34,1.56,0.64,1)_both] place-items-center rounded-[0.24em] shadow-[0_0.12em_0.3em_-0.08em_rgb(0_0_0/0.35)]"
        style={{ ...toneProps(slot.tone).style, animationDelay: `${delay}ms` }}
        data-ink={slot.tone.ink}
      >
        <FluentEmoji emoji={slot.emoji} size={64} className="!h-[0.56em] !w-[0.56em]" />
      </span>
    </span>
  )
}

/**
 * All of a slot's words stacked in one grid cell. The line breaks are fixed
 * (four balanced lines on phones), so the slot can animate to the current word's own
 * width: no gaps, no reflow, the line just slides. Nothing is clipped.
 */
function WordSlot({ words, current, previous, delay }: { words: string[]; current: number; previous: number; delay: number }) {
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const [widths, setWidths] = useState<number[]>([])

  useEffect(() => {
    const read = () => setWidths(refs.current.map((el) => el?.offsetWidth ?? 0))
    read()
    document.fonts?.ready.then(read)
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])

  const width = widths[current]
  return (
    <span
      className="inline-grid justify-items-start transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] [width:var(--slot-w)] motion-reduce:transition-none"
      style={{ ["--slot-w" as string]: width ? `${width}px` : "auto", transitionDelay: `${delay}ms` }}
    >
      {words.map((word, i) => (
        <span
          key={word}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={cn(
            "col-start-1 row-start-1 whitespace-nowrap transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
            i === current ? "translate-y-0 opacity-100 blur-0" : i === previous ? "-translate-y-[0.35em] opacity-0 blur-[3px]" : "translate-y-[0.35em] opacity-0 blur-[3px]"
          )}
          style={{ transitionDelay: i === current ? `${delay}ms` : "0ms" }}
          aria-hidden={i !== current}
        >
          {word}
        </span>
      ))}
    </span>
  )
}

export function RotatingHeadline({ sets, className }: { sets: HeadlineSet[]; className?: string }) {
  const [state, setState] = useState({ current: 0, previous: -1 })

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setState((s) => ({ current: (s.current + 1) % sets.length, previous: s.current })), INTERVAL_MS)
    return () => clearInterval(t)
  }, [sets.length])

  const { current, previous } = state
  const set = sets[current]
  const words = (slot: number) => sets.map((s) => s[slot].word)

  return (
    <h1 className={className}>
      <span className="sr-only">
        Where {sets[0][0].word}, {sets[0][1].word} and {sets[0][2].word} come together.
      </span>
      <span aria-hidden>
        Where <Tile slot={set[0]} index={0} delay={0} />
        <WordSlot words={words(0).map((w) => `${w},`)} current={current} previous={previous} delay={0} />
        <br /> <Tile slot={set[1]} index={1} delay={STAGGER_MS} />
        <WordSlot words={words(1)} current={current} previous={previous} delay={STAGGER_MS} /> <br className="md:hidden" />
        and
        <br className="hidden md:inline" /> <Tile slot={set[2]} index={2} delay={STAGGER_MS * 2} />
        <WordSlot words={words(2)} current={current} previous={previous} delay={STAGGER_MS * 2} /> <br className="md:hidden" />
        come together.
      </span>

      {/* Every emoji once, so a swap never waits on an image. */}
      <span className="hidden" aria-hidden>
        {sets.flat().map((s) => (
          <FluentEmoji key={s.emoji} emoji={s.emoji} size={64} />
        ))}
      </span>
    </h1>
  )
}
