import { MARK_BASE, MARK_TOP, MARK_VIEWBOX } from "@/lib/brand-mark"
import { cn } from "@/lib/utils"

/**
 * The Bundel mark in two tones. By default ink + ink-2 (black and dark grey,
 * white and light grey in dark mode). A parent can recolour it by setting
 * --mark-base and --mark-top, as shared Bundel pages do with their own tone
 * (see .mark-tone in globals.css).
 */
export function BundelMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={cn("h-7 w-auto shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={MARK_BASE} style={{ fill: "var(--mark-base, oklch(var(--ink)))" }} />
      <path d={MARK_TOP} style={{ fill: "var(--mark-top, oklch(var(--ink-2)))" }} />
    </svg>
  )
}

/** Mark plus wordmark, for headers. */
export function BundelLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <BundelMark className={markClassName} />
      Bundel
    </span>
  )
}
