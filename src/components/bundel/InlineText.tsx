"use client"

import { useLayoutEffect, useRef, useState } from "react"

/** Text that is edited in place and saved when it loses focus. */
export function InlineText({
  value, onCommit, placeholder, className, maxLength, label,
}: {
  value: string
  onCommit: (value: string) => void
  placeholder: string
  className?: string
  maxLength: number
  label: string
}) {
  // Callers key this on `value`, so a new saved value starts a fresh draft.
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  // Grow with the content so long titles wrap like the visitor view.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={draft}
      maxLength={maxLength}
      aria-label={label}
      placeholder={placeholder}
      enterKeyHint="done"
      onChange={(e) => setDraft(e.target.value.replace(/\n/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        }
        if (e.key === "Escape") {
          setDraft(value)
          requestAnimationFrame(() => ref.current?.blur())
        }
      }}
      onBlur={() => {
        const next = draft.trim()
        if (next !== value) onCommit(next)
      }}
      className={
        "block w-full resize-none overflow-hidden rounded-xl bg-transparent outline-none transition-colors " +
        "placeholder:text-white/60 hover:bg-white/10 focus:bg-white/15 focus:ring-2 focus:ring-white/50 -mx-2 px-2 " +
        (className ?? "")
      }
    />
  )
}
