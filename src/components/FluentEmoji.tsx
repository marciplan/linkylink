"use client"

import { useEffect, useRef, useState } from "react"
import { fluentEmojiUrls } from "@/lib/fluent-emoji"

interface FluentEmojiProps {
  emoji: string
  size: number
  className?: string
  /** Read the emoji to screen readers (off when it is purely decorative). */
  label?: boolean
}

/** An emoji drawn from the Fluent set, falling back to the system emoji if no file matches. */
export function FluentEmoji({ emoji, size, className, label = false }: FluentEmojiProps) {
  const urls = fluentEmojiUrls(emoji)
  const [attempt, setAttempt] = useState({ emoji, index: 0 })
  const img = useRef<HTMLImageElement>(null)
  // Start over when the emoji changes.
  const index = attempt.emoji === emoji ? attempt.index : 0
  const next = () => setAttempt({ emoji, index: index + 1 })

  // A file that failed before hydration never fires onError; check once mounted.
  useEffect(() => {
    const el = img.current
    if (el && el.complete && el.naturalWidth === 0) setAttempt((a) => ({ emoji: a.emoji, index: a.index + 1 }))
  }, [emoji, index])

  if (index >= urls.length) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.86, lineHeight: 1 }}
        role={label ? "img" : undefined}
        aria-hidden={label ? undefined : true}
      >
        {emoji}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- small fixed-size icons from a CDN
    <img
      ref={img}
      key={urls[index]}
      src={urls[index]}
      alt={label ? emoji : ""}
      aria-hidden={label ? undefined : true}
      width={size}
      height={size}
      decoding="async"
      draggable={false}
      onError={next}
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
