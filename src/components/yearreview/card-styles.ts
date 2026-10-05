// Visual recipe for a category card, shared by the visitor and owner views.

export function cardBackground(hue: number, type: "BEST" | "WORST") {
  return type === "BEST"
    ? `linear-gradient(155deg, oklch(0.55 0.2 ${hue}) 0%, oklch(0.42 0.17 ${(hue + 38) % 360}) 100%)`
    : `linear-gradient(155deg, oklch(0.3 0.045 ${hue}) 0%, oklch(0.2 0.03 ${(hue + 30) % 360}) 100%)`
}

export const glassPanel = "bg-white/[0.14] ring-1 ring-white/20 backdrop-blur-sm"
export const glassRow = "bg-white/[0.09] ring-1 ring-white/15"
