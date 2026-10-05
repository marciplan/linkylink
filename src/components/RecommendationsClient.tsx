"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowRight, Check, Copy, Loader2, Move, Sparkles, X } from "lucide-react"
import { Favicon } from "@/components/bundel/Favicon"
import { Button } from "@/components/ui/button"
import { domainOf } from "@/lib/links"
import { generateRecommendations, planBestFitMoves, type Bundle } from "@/lib/recommendations"

export function RecommendationsClient({
  bundles,
  dismissedLinkIds
}: {
  bundles: Bundle[]
  dismissedLinkIds: string[]
}) {
  const router = useRouter()
  const [processingLinks, setProcessingLinks] = useState<Set<string>>(new Set())
  const [dismissedLinks, setDismissedLinks] = useState<Set<string>>(new Set(dismissedLinkIds))

  const recommendations = useMemo(() => {
    return generateRecommendations(bundles).filter(rec => !dismissedLinks.has(rec.link.id))
  }, [bundles, dismissedLinks])

  const handleAction = async (
    linkId: string,
    targetBundleId: string,
    action: "move" | "copy"
  ) => {
    setProcessingLinks(prev => new Set(prev).add(linkId))

    try {
      const response = await fetch("/api/recommendations/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, targetBundleId, action })
      })

      if (!response.ok) {
        throw new Error("Failed to perform action")
      }

      toast(action === "move" ? "Link moved" : "Link copied over")
      router.refresh()
    } catch (error) {
      console.error("Error performing action:", error)
      toast.error("That didn't work. Please try again.")
      setProcessingLinks(prev => {
        const next = new Set(prev)
        next.delete(linkId)
        return next
      })
    }
  }

  const [applyingAll, setApplyingAll] = useState(false)
  const bestFitCount = useMemo(() => planBestFitMoves(recommendations).length, [recommendations])

  const post = (moves?: unknown[], restore?: unknown[]) =>
    fetch("/api/recommendations/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(moves ? { moves } : { restore })
    })

  // Move every link to its best-fit Bundel in one go; Undo puts them all back.
  const handleApplyAll = async () => {
    const moves = planBestFitMoves(recommendations)
    setApplyingAll(true)
    try {
      const response = await post(moves)
      if (!response.ok) throw new Error("Failed to apply suggestions")
      const { moved, undo } = await response.json()
      toast(`Tidied ${moved} ${moved === 1 ? "link" : "links"}`, {
        duration: 8000,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const res = await post(undefined, undo)
              if (!res.ok) throw new Error("Undo failed")
              router.refresh()
            } catch {
              toast.error("Couldn't undo that. Please try again.")
            }
          }
        }
      })
      router.refresh()
    } catch (error) {
      console.error("Error applying suggestions:", error)
      toast.error("That didn't work. Please try again.")
    } finally {
      setApplyingAll(false)
    }
  }

  const handleDismiss = async (linkId: string) => {
    // Hide immediately; restore if the server disagrees.
    setDismissedLinks(prev => new Set(prev).add(linkId))
    try {
      const response = await fetch("/api/recommendations/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId })
      })

      if (!response.ok) {
        throw new Error("Failed to dismiss recommendation")
      }
    } catch (error) {
      console.error("Error dismissing recommendation:", error)
      toast.error("Couldn't dismiss that suggestion")
      setDismissedLinks(prev => {
        const next = new Set(prev)
        next.delete(linkId)
        return next
      })
    }
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-14 text-center shadow-card">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-tint-soft text-tint-ink">
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <h2 className="mt-4 text-lg font-semibold">All tidy</h2>
        <p className="mt-1 text-[15px] text-ink-2">Every link looks like it&apos;s in the right Bundel.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-3xl bg-tint-soft p-4 text-tint-ink">
        <Sparkles className="h-5 w-5 shrink-0" />
        <p className="min-w-0 flex-1 text-[14px] font-medium leading-snug">
          Move {bestFitCount === recommendations.length ? "all " : ""}{bestFitCount} {bestFitCount === 1 ? "link" : "links"} to the best fit? You can undo it.
        </p>
        <Button variant="primary" size="sm" onClick={handleApplyAll} disabled={applyingAll || processingLinks.size > 0}>
          {applyingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />}
          Apply all
        </Button>
      </div>
      {recommendations.map((recommendation) => {
        const isProcessing = processingLinks.has(recommendation.link.id)
        const best = recommendation.suggestedBundles[0]

        return (
          <article key={recommendation.link.id} className="rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line/50">
            <div className="flex items-start gap-3">
              <Favicon url={recommendation.link.url} favicon={recommendation.link.favicon} size={40} />
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 font-semibold leading-snug">{recommendation.link.title}</h3>
                <p className="mt-0.5 truncate text-[13px] text-ink-3">
                  {domainOf(recommendation.link.url)} · in {recommendation.currentBundle.title}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(recommendation.link.id)}
                className="pressable -mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-ink/5"
                disabled={isProcessing}
                aria-label="Dismiss this suggestion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {recommendation.suggestedBundles.map((suggestion) => (
                <div key={suggestion.bundle.id} className="rounded-2xl bg-surface-2/70 p-3">
                  <div className="flex items-center gap-2 text-[15px]">
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{suggestion.bundle.title}</span>
                    {suggestion === best && (
                      <span className="shrink-0 rounded-full bg-tint-soft px-2 py-0.5 text-[11px] font-semibold text-tint-ink">Best fit</span>
                    )}
                  </div>
                  <p className="mt-0.5 pl-6 text-[13px] text-ink-2">{suggestion.reason}</p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 pl-6">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAction(recommendation.link.id, suggestion.bundle.id, "copy")}
                      disabled={isProcessing}
                      className="bg-surface"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAction(recommendation.link.id, suggestion.bundle.id, "move")}
                      disabled={isProcessing}
                    >
                      <Move className="h-3.5 w-3.5" />
                      Move
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}
