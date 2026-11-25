"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Marks its subtree with data-inview="true" the first time it scrolls into
 * view. Children animate with `group-data-[inview=true]/inview:` classes, so
 * the markup stays server-rendered and only this wrapper ships JS.
 */
export function InView({ children, className, threshold = 0.35 }: { children: React.ReactNode; className?: string; threshold?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return (
    <div ref={ref} data-inview={shown} className={`group/inview ${className ?? ""}`}>
      {children}
    </div>
  )
}
