"use client"

import { SquareArrowOutUpRight } from "lucide-react"
import { toast } from "sonner"
import { isHttpUrl } from "@/lib/http-url"
import { cn } from "@/lib/utils"

interface OpenAllButtonProps {
  links: { id: string; url: string }[]
  /** Count each opened tab as a click, like the rows' ping does for visitors. */
  countClicks?: boolean
  className?: string
}

/**
 * Opens every link in its own tab, in list order. Browsers allow one pop-up
 * per click, so the first time only one tab opens and the browser offers to
 * allow pop-ups for the site; after that, all of them open.
 */
export function OpenAllButton({ links: all, countClicks, className }: OpenAllButtonProps) {
  // window.open skips React's javascript: guard, so only ever open web links.
  const links = all.filter((l) => isHttpUrl(l.url))
  if (links.length < 2) return null

  const openAll = () => {
    let blocked = 0
    for (const link of links) {
      const tab = window.open(link.url, "_blank")
      if (!tab) {
        blocked++
        continue
      }
      tab.opener = null
      if (countClicks) navigator.sendBeacon?.(`/api/links/${link.id}/click`)
    }
    if (blocked > 0) {
      toast(`Your browser stopped ${blocked} ${blocked === 1 ? "tab" : "tabs"}`, {
        description: `Allow pop-ups for ${window.location.host} (the icon in the address bar), then click Open all again.`,
        duration: 10000,
      })
    }
  }

  return (
    <button
      type="button"
      onClick={openAll}
      title={`Open all ${links.length} links in new tabs`}
      className={cn("pressable inline-flex h-8 items-center gap-1.5 rounded-full bg-white/15 px-3 text-sm font-semibold text-white hover:bg-white/25", className)}
    >
      <SquareArrowOutUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      Open all
    </button>
  )
}
