// Visual recipe for a category card, shared by the visitor and owner views.

import { emojiTone } from "@/lib/emoji-tone"
import { cardGradient } from "@/lib/tone"
import { categoryEmoji } from "@/lib/year-review"

/** A category's card takes its colour from the category's own emoji. */
export function cardBackground(icon: string, type: "BEST" | "WORST") {
  return cardGradient(emojiTone(categoryEmoji(icon)), type)
}

export const glassPanel = "bg-white/[0.14] ring-1 ring-white/20 backdrop-blur-sm"
export const glassRow = "bg-white/[0.09] ring-1 ring-white/15"
