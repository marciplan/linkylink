"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TopBarProps {
  title: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  /** Id of an element; the bar turns solid once it scrolls under the bar. */
  watchId?: string
}

/**
 * Floating controls over the hero that become a solid, titled bar on scroll.
 * Children can read the state through the `data-solid` attribute.
 */
export function TopBar({ title, leading, trailing, watchId = "hero-end" }: TopBarProps) {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const el = document.getElementById(watchId)
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setSolid(!entry.isIntersecting && entry.boundingClientRect.top < 80), {
      rootMargin: "-64px 0px 0px 0px",
    })
    io.observe(el)
    return () => io.disconnect()
  }, [watchId])

  return (
    <div
      data-solid={solid}
      className={cn(
        "group fixed inset-x-0 top-0 z-40 pt-safe transition-colors duration-200",
        solid ? "glass border-b border-line/60 text-ink" : "border-b border-transparent text-white"
      )}
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-3">
        <div className="flex min-w-[44px] items-center">{leading}</div>
        <p
          className={cn(
            "flex-1 truncate text-center text-[15px] font-semibold transition-all duration-200",
            solid ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          )}
          aria-hidden={!solid}
        >
          {title}
        </p>
        <div className="flex min-w-[44px] items-center justify-end gap-1.5">{trailing}</div>
      </div>
    </div>
  )
}
