// A Bundel's colour comes from its icon. The emoji is the only saturated thing on
// a surface; everything behind it is a quiet tone of the emoji's own hue, with
// lightness chosen so the emoji always has contrast. See tone.ts for painting a tone.

import type { BundelIcon } from "@/lib/bundel-icon"
import { EMOJI_PALETTE } from "@/lib/emoji-palette-data"
import { bundelHue } from "@/lib/theme"
import type { Tone } from "@/lib/tone"

type Entry = { h: number; c: number; l: number }

let table: Map<string, Entry> | null = null

function palette() {
  if (!table) {
    table = new Map()
    for (const row of EMOJI_PALETTE.split(";")) {
      const [key, h, c, l] = row.split(":")
      if (key) table.set(key, { h: +h, c: +c / 1000, l: +l / 100 })
    }
  }
  return table
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const GRAPHITE: Tone = { hue: 265, soft: 0.012, deep: 0.02, ink: "mid", neutral: true }

function lookup(emoji: string): Entry | undefined {
  const cps = Array.from(emoji)
    .map((c) => c.codePointAt(0)!)
    // Variation selector and skin tones don't change which artwork's colour we want.
    .filter((c) => c !== 0xfe0f && !(c >= 0x1f3fb && c <= 0x1f3ff))
    .map((c) => c.toString(16).padStart(4, "0"))
  const t = palette()
  return t.get(cps.join("-")) ?? t.get(cps[0])
}

/** The tone for an emoji; graphite when the emoji is unknown or has no colour to speak of. */
export function emojiTone(emoji: string): Tone {
  const e = lookup(emoji)
  if (!e || e.c < 0.05) return e ? { ...GRAPHITE, ink: e.l < 0.5 ? "dark" : e.l > 0.84 ? "light" : "mid" } : GRAPHITE
  return {
    hue: e.h,
    soft: clamp(0.03 + Math.min(e.c, 0.15) * 0.4, 0.03, 0.085),
    deep: clamp(e.c * 0.7, 0.06, 0.12),
    ink: e.l < 0.5 ? "dark" : e.l > 0.84 ? "light" : "mid",
    neutral: false,
  }
}

/** A Bundel's tone: its emoji's, or (for a photo icon) a stable hue from its slug. */
export function bundelTone(slug: string, icon: BundelIcon): Tone {
  if (icon.kind === "emoji") return emojiTone(icon.value)
  return { hue: bundelHue(slug), soft: 0.05, deep: 0.09, ink: "mid", neutral: false }
}
