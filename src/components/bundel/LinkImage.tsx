"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** A link's share image, hotlinked like favicons. Hides itself when the site refuses it. */
export function LinkImage({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const img = useRef<HTMLImageElement>(null)

  // An image that errored before hydration never fires onError, so check once mounted.
  useEffect(() => {
    const el = img.current
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])

  if (failed) return null
  return (
    <span className={cn("block overflow-hidden rounded-2xl bg-tint-soft ring-1 ring-inset ring-black/5 dark:ring-white/10", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party hosts */}
      <img
        ref={img}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="aspect-[2.4/1] w-full object-cover"
      />
    </span>
  )
}
