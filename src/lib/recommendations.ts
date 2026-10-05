// Suggests links that may belong in a different Bundel, based on word overlap
// with that Bundel's title and links, shared domains and similar notes.

export type Link = {
  id: string
  title: string
  url: string
  favicon: string | null
  context: string | null
  order: number
}

export type Bundle = {
  id: string
  title: string
  slug: string
  links: Link[]
  user: {
    username: string
  }
}

export type Recommendation = {
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

export function generateRecommendations(bundles: Bundle[]): Recommendation[] {
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
