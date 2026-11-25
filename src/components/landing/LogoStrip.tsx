"use client"

import { useEffect, useState } from "react"
import { BRAND_LOGOS, type BrandLogo } from "@/lib/brand-logos"

const SLOTS = 3
const INTERVAL_MS = 2600
const CASCADE_MS = 220

function Logo({ logo, leaving = false }: { logo: BrandLogo; leaving?: boolean }) {
  return (
    <span
      className={
        leaving
          ? "absolute inset-0 flex animate-[logo-out_560ms_cubic-bezier(0.7,0,0.84,0)_both] items-center justify-center gap-2.5 text-ink-3"
          : "absolute inset-0 flex animate-[logo-in_700ms_cubic-bezier(0.16,1,0.3,1)_both] items-center justify-center gap-2.5 text-ink-3"
      }
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current sm:h-7 sm:w-7 md:h-8 md:w-8" role="img" aria-label={logo.showName ? undefined : logo.name}>
        <path d={logo.path} />
      </svg>
      {logo.showName && <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight sm:text-[22px] md:text-[26px]">{logo.name}</span>}
    </span>
  )
}

/** "Great to share your links from": three logos at a time, swapped one after another. */
export function LogoStrip() {
  // Each slot: the logo showing now, and the one that just left (animating out).
  const [slots, setSlots] = useState(() => Array.from({ length: SLOTS }, (_, i) => ({ now: i, prev: -1 })))

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const tick = setInterval(() => {
      for (let k = 0; k < SLOTS; k++) {
        timers.push(
          setTimeout(() => setSlots((prev) => prev.map((v, i) => (i === k ? { now: (v.now + SLOTS) % BRAND_LOGOS.length, prev: v.now } : v))), k * CASCADE_MS)
        )
      }
    }, INTERVAL_MS)
    return () => {
      clearInterval(tick)
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <section className="px-5 pb-20 lg:pb-28" aria-label="Sites people share from">
      <p className="text-center text-[17px] text-ink-3">Great to share your links from</p>
      <p className="sr-only">{BRAND_LOGOS.map((l) => l.name).join(", ")}</p>
      <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-x-2 sm:grid-cols-3" aria-hidden>
        {slots.map((slot, k) => (
          <li key={k} className={`relative h-12 overflow-hidden ${k === 2 ? "hidden sm:block" : ""}`}>
            {slot.prev >= 0 && <Logo key={`out-${BRAND_LOGOS[slot.prev].name}`} logo={BRAND_LOGOS[slot.prev]} leaving />}
            <Logo key={`in-${BRAND_LOGOS[slot.now].name}`} logo={BRAND_LOGOS[slot.now]} />
          </li>
        ))}
      </ul>
    </section>
  )
}
