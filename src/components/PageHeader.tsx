"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  /** Small leading element in the compact bar (e.g. back button). */
  leading?: React.ReactNode
  /** Trailing actions shown in the compact bar. */
  actions?: React.ReactNode
  children?: React.ReactNode
}

/**
 * iOS-style large title that hands off to a compact, blurred sticky bar once
 * it scrolls out of view.
 */
export function PageHeader({ title, subtitle, leading, actions, children }: PageHeaderProps) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [condensed, setCondensed] = useState(false)

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setCondensed(!entry.isIntersecting), {
      rootMargin: "-56px 0px 0px 0px",
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-40 pt-safe transition-[background-color,border-color] duration-200",
          condensed ? "glass border-b border-line/60" : "border-b border-transparent"
        )}
      >
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <div className="flex min-w-[44px] items-center">{leading}</div>
          <p
            className={cn(
              "flex-1 truncate text-center text-[15px] font-semibold transition-all duration-200",
              condensed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            )}
            aria-hidden={!condensed}
          >
            {title}
          </p>
          <div className="flex min-w-[44px] items-center justify-end gap-1">{actions}</div>
        </div>
      </div>
      <header className="mx-auto max-w-2xl px-5 pb-4 pt-1">
        <h1 className="text-display text-balance">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink-2 text-pretty">{subtitle}</p>}
        <div ref={sentinel} aria-hidden />
        {children}
      </header>
    </>
  )
}
