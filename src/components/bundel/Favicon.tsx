"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { domainOf, faviconFor } from "@/lib/links"

interface FaviconProps {
  url: string
  favicon?: string | null
  size?: number
  className?: string
}

/** Site icon on a tinted tile, falling back to the domain's initial if it fails to load. */
export function Favicon({ url, favicon, size = 44, className }: FaviconProps) {
  const [failed, setFailed] = useState(false)
  const img = useRef<HTMLImageElement>(null)

  // An image that errored before hydration never fires onError, so check once mounted.
  useEffect(() => {
    const el = img.current
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])
  const initial = domainOf(url).charAt(0).toUpperCase() || "•"

  return (
    <span
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-[14px] bg-tint-soft", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {failed ? (
        <span className="font-semibold text-tint-ink" style={{ fontSize: size * 0.42 }}>
          {initial}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- tiny third-party icons, no optimisation needed
        <img
          ref={img}
          src={faviconFor(url, favicon)}
          alt=""
          width={Math.round(size * 0.5)}
          height={Math.round(size * 0.5)}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="object-contain"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
      )}
    </span>
  )
}
