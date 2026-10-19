// Colour helpers for a Bundel's tone. Kept apart from the emoji lookup so client
// components that only need to paint a tone don't download the palette table.

import type { CSSProperties } from "react"
import { oklchToHex } from "@/lib/theme"

export interface Tone {
  /** OKLCH hue, 0-359. */
  hue: number
  /** Chroma of soft surfaces (tiles, chips). */
  soft: number
  /** Chroma of deep surfaces (heroes, cards). */
  deep: number
  /** How light the emoji itself is: decides which way the tile's lightness flips. */
  ink: "dark" | "mid" | "light"
  /** Greys, blacks and whites carry no hue, so they get a graphite tone. */
  neutral: boolean
}

/** Spread onto an element: sets the variables the `.tone-*` classes in globals.css read. */
export function toneProps(tone: Tone) {
  return {
    style: { "--t-h": tone.hue, "--t-s": tone.soft, "--t-c": tone.deep } as CSSProperties,
    "data-ink": tone.ink,
  }
}

/** Deep field colours as OKLCH strings, for places that can't use the CSS classes. */
export function cardGradient(tone: Tone, type: "BEST" | "WORST" = "BEST") {
  const h = tone.hue
  return type === "BEST"
    ? `linear-gradient(155deg, oklch(0.46 ${tone.deep} ${h}) 0%, oklch(0.31 ${tone.deep * 0.85} ${(h + 14) % 360}) 100%)`
    : `linear-gradient(155deg, oklch(0.3 ${tone.deep * 0.5} ${h}) 0%, oklch(0.2 ${tone.deep * 0.35} ${(h + 14) % 360}) 100%)`
}

/** The same colours in sRGB for the image renderer, which doesn't understand OKLCH. */
export function tonePalette(tone: Tone) {
  const h = tone.hue
  const hex = oklchToHex
  return {
    field: [
      `radial-gradient(circle at 22% 32%, ${hex(0.46, tone.deep, h)} 0%, transparent 70%)`,
      `linear-gradient(165deg, ${hex(0.38, tone.deep, h)} 0%, ${hex(0.24, tone.deep * 0.85, (h + 14) % 360)} 100%)`,
    ].join(", "),
    /** Pale identity tile behind the emoji (deeper when the emoji itself is pale). */
    chip: tone.ink === "light" ? hex(0.42, tone.soft + 0.03, h) : hex(0.965, tone.soft * 0.7, h),
    soft: hex(0.95, tone.soft * 0.7, h),
    ink: hex(0.4, Math.max(tone.deep, 0.05), h),
    story: (type: "BEST" | "WORST") =>
      type === "BEST"
        ? `linear-gradient(165deg, ${hex(0.46, tone.deep, h)} 0%, ${hex(0.28, tone.deep * 0.85, (h + 14) % 360)} 100%)`
        : `linear-gradient(165deg, ${hex(0.3, tone.deep * 0.5, h)} 0%, ${hex(0.17, tone.deep * 0.35, (h + 14) % 360)} 100%)`,
  }
}

/** Browser chrome colour that blends into the top of a hero. */
export function toneThemeColor(tone: Tone): string {
  return oklchToHex(0.42, tone.deep, tone.hue)
}
