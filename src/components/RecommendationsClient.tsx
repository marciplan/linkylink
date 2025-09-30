"use client"

import { useState, useMemo } from "react"
import { ArrowRight, Copy, Move, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

type Link = {
  id: string
  title: string
  url: string
  favicon: string | null
  context: string | null
  order: number
}

type Bundle = {
  id: string
  title: string
  slug: string
  links: Link[]
  user: {
    username: string
  }
}

type Recommendation = {
  link: Link
  currentBundle: Bundle
  suggestedBundles: Array<{
    bundle: Bundle
    score: number
    reason: string
  }>
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)

  const set1 = new Set(words1)
  const set2 = new Set(words2)

  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

function generateRecommendations(bundles: Bundle[]): Recommendation[] {
  const recommendations: Recommendation[] = []

  for (const currentBundle of bundles) {
    for (const link of currentBundle.links) {
      const suggestedBundles: Array<{ bundle: Bundle; score: number; reason: string }> = []

      // Compare this link with other bundles
      for (const targetBundle of bundles) {
        if (targetBundle.id === currentBundle.id) continue

        let totalScore = 0
        let matchCount = 0
        const reasons: string[] = []

        // Check similarity with target bundle title
        const titleSimilarity = calculateSimilarity(link.title, targetBundle.title)
        if (titleSimilarity > 0.2) {
          totalScore += titleSimilarity * 2
          matchCount++
          reasons.push("Title matches bundle theme")
        }

        // Check similarity with other links in target bundle
        for (const targetLink of targetBundle.links) {
          const linkTitleSimilarity = calculateSimilarity(link.title, targetLink.title)
          if (linkTitleSimilarity > 0.3) {
            totalScore += linkTitleSimilarity
            matchCount++
          }

          // Check URL domain similarity
          try {
            const linkDomain = new URL(link.url).hostname
            const targetDomain = new URL(targetLink.url).hostname
            if (linkDomain === targetDomain) {
              totalScore += 0.5
              reasons.push("Same domain as other links")
            }
          } catch {
            // Invalid URL, skip
          }

          // Check context similarity
          if (link.context && targetLink.context) {
            const contextSimilarity = calculateSimilarity(link.context, targetLink.context)
            if (contextSimilarity > 0.3) {
              totalScore += contextSimilarity * 1.5
              matchCount++
              reasons.push("Similar context to other links")
            }
          }
        }

        const averageScore = matchCount > 0 ? totalScore / matchCount : 0

        if (averageScore > 0.15) {
          suggestedBundles.push({
            bundle: targetBundle,
            score: averageScore,
            reason: reasons.length > 0 ? reasons[0] : "Similar content"
          })
        }
      }

      // Only add recommendations if we found at least one good match
      if (suggestedBundles.length > 0) {
        suggestedBundles.sort((a, b) => b.score - a.score)
        recommendations.push({
          link,
          currentBundle,
          suggestedBundles: suggestedBundles.slice(0, 3) // Top 3 suggestions
        })
      }
    }
  }

  // Sort recommendations by best score
  recommendations.sort((a, b) => {
    const aScore = a.suggestedBundles[0]?.score || 0
    const bScore = b.suggestedBundles[0]?.score || 0
    return bScore - aScore
  })

  return recommendations
}

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

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Error performing action:", error)
      alert("Failed to perform action. Please try again.")
      setProcessingLinks(prev => {
        const next = new Set(prev)
        next.delete(linkId)
        return next
      })
    }
  }

  const handleDismiss = async (linkId: string) => {
    try {
      const response = await fetch("/api/recommendations/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId })
      })

      if (!response.ok) {
        throw new Error("Failed to dismiss recommendation")
      }

      // Update local state to hide immediately
      setDismissedLinks(prev => new Set(prev).add(linkId))
    } catch (error) {
      console.error("Error dismissing recommendation:", error)
      alert("Failed to dismiss recommendation. Please try again.")
    }
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
        <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">All Set!</h2>
        <p className="text-gray-600">No recommendations at the moment. Your Bundels are well organized!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {recommendations.map((recommendation) => {
        const isProcessing = processingLinks.has(recommendation.link.id)

        return (
          <div
            key={recommendation.link.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {recommendation.link.favicon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recommendation.link.favicon}
                      alt=""
                      className="w-4 h-4"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <h3 className="font-medium text-gray-900">{recommendation.link.title}</h3>
                </div>
                <a
                  href={recommendation.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-blue-600 underline mb-1 inline-block"
                >
                  {recommendation.link.url}
                </a>
                <p className="text-sm text-gray-500 mb-1">
                  Currently in:{" "}
                  <a
                    href={`/${recommendation.currentBundle.user.username}/${recommendation.currentBundle.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-700 hover:text-blue-600 underline"
                  >
                    {recommendation.currentBundle.title}
                  </a>
                </p>
                {recommendation.link.context && (
                  <p className="text-sm text-gray-600 mt-2">{recommendation.link.context}</p>
                )}
              </div>
              <button
                onClick={() => handleDismiss(recommendation.link.id)}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                disabled={isProcessing}
                title="Dismiss this recommendation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {recommendation.suggestedBundles.map((suggestion) => (
                <div
                  key={suggestion.bundle.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-100"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <div>
                      <a
                        href={`/${suggestion.bundle.user.username}/${suggestion.bundle.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-blue-600 underline"
                      >
                        {suggestion.bundle.title}
                      </a>
                      <p className="text-sm text-gray-600">{suggestion.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {Math.round(suggestion.score * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(recommendation.link.id, suggestion.bundle.id, "copy")}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      title="Copy to this bundle (keep in current bundle)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={() => handleAction(recommendation.link.id, suggestion.bundle.id, "move")}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      title="Move to this bundle (remove from current bundle)"
                    >
                      <Move className="w-3.5 h-3.5" />
                      Move
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}