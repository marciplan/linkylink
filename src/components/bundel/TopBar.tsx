"use client"

import { useEffect, useState } from "react"
import { useIsDesktop } from "@/components/DesktopOnly"
import { BundelIconTile } from "@/components/bundel/BundelHero"
import type { BundelIcon } from "@/lib/bundel-icon"
import { toneProps, type Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"

interface TopBarProps {
  title: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  /** With these, the bar becomes a small copy of the hero (its colours, icon and a line of meta) instead of a plain glass bar. */
  tone?: Tone
  icon?: BundelIcon
  meta?: string
}

/**
 * Floating controls over the hero. Once the hero's title scrolls under them, the
 * bar becomes solid and titled, so you always know which Bundel you're in.
 * Children can read the plain-glass state through `data-solid`.
 */
export function TopBar({ title, leading, trailing, tone, icon, meta }: TopBarProps) {
  const [scrolled, setScrolled] = useState(false)
  // On desktop the hero is a fixed side panel, so the bar never needs to turn solid.
  const desktop = useIsDesktop()
  const solid = scrolled && !desktop
  const compactHero = !!tone && !!icon

  useEffect(() => {
    // The hero's title, so the bar takes over just as the big title disappears.
    const el = document.getElementById("hero-title") ?? document.getElementById("hero-end")
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting && entry.boundingClientRect.top < 80), {
      rootMargin: "-64px 0px 0px 0px",
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      // Toned bars stay dark, so their buttons keep the over-the-hero style.
      data-solid={solid && !compactHero}
      className={cn(
        "group fixed inset-x-0 top-0 z-40 overflow-hidden pt-safe transition-[background-color,border-color,box-shadow] duration-200 lg:right-auto lg:w-[var(--pane)]",
        solid
          ? compactHero
            ? "text-white shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)]"
            : "glass border-b border-line/60 text-ink"
          : "border-b border-transparent text-white"
      )}
    >
      {compactHero && (
        <div
          aria-hidden
          className={cn("tone-hero absolute inset-0 -z-10 transition-opacity duration-200", solid ? "opacity-100" : "opacity-0")}
          {...toneProps(tone)}
        />
      )}
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-3 lg:max-w-none lg:px-6">
        <div className="flex min-w-[44px] items-center">{leading}</div>
        {compactHero ? (
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
              solid ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            )}
            aria-hidden={!solid}
          >
            <span className={cn("transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", solid ? "scale-100" : "scale-50")}>
              <BundelIconTile icon={icon} tone={tone} size={32} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-semibold">{title}</span>
              {meta && <span className="block truncate text-[12px] font-medium text-white/75">{meta}</span>}
            </span>
          </div>
        ) : (
          <p
            className={cn(
              "flex-1 truncate text-center text-[15px] font-semibold transition-all duration-200",
              solid ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            )}
            aria-hidden={!solid}
          >
            {title}
          </p>
        )}
        <div className="flex min-w-[44px] items-center justify-end gap-1.5">{trailing}</div>
      </div>
    </div>
  )
}
