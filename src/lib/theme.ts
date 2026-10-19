// Per-Bundel visual identity, derived deterministically so every page has a
// distinct but harmonious look without the owner doing any design work.

const HUES = [265, 290, 330, 15, 45, 150, 180, 220]

function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function bundelHue(seed: string): number {
  return HUES[hashString(seed) % HUES.length]
}

/** sRGB hex for an OKLCH colour (gamut-clipped), for <meta name="theme-color">. */
export function oklchToHex(L: number, C: number, h: number): string {
  const a = C * Math.cos((h * Math.PI) / 180)
  const b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return (
    "#" +
    channels
      .map((x) => {
        const c = Math.min(1, Math.max(0, x))
        const srgb = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
        return Math.round(srgb * 255).toString(16).padStart(2, "0")
      })
      .join("")
  )
}
