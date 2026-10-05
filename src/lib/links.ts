// URL helpers shared by every place that accepts or displays a link.

export function normalizeUrl(input: string): string {
  const url = input.trim()
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

export function isProbablyUrl(input: string): boolean {
  const value = input.trim()
  if (!value || /\s/.test(value)) return false
  try {
    const u = new URL(normalizeUrl(value))
    return /\./.test(u.hostname)
  } catch {
    return false
  }
}

/** Pull the first URL out of arbitrary shared text (Android often puts it in `text`). */
export function findUrl(text: string | null | undefined): string | null {
  if (!text) return null
  const match = text.match(/https?:\/\/[^\s<>"']+/i)
  if (match) return match[0]
  return isProbablyUrl(text) ? normalizeUrl(text) : null
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function faviconFor(url: string, favicon?: string | null): string {
  return favicon || `https://www.google.com/s2/favicons?domain=${domainOf(url)}&sz=64`
}

const ROUTING_NOISE = new Set([
  "p", "dp", "gp", "product", "products", "item", "items",
  "ref", "category", "categories", "c", "tag", "tags",
  "page", "pages", "view", "detail", "details", "www",
])

/** Best-effort readable title from a URL path, used before/without unfurling. */
export function titleFromUrl(input: string): string {
  if (!input) return ""
  try {
    const urlObj = new URL(normalizeUrl(input))
    const segments = urlObj.pathname.split("/").filter(Boolean)

    const isJunk = (s: string): boolean => {
      if (!s) return true
      if (/^\d+$/.test(s)) return true // pure numeric IDs
      if (/^[0-9a-f]{8,}$/i.test(s) && !/[-_]/.test(s)) return true // hash/sku
      if (/^[0-9a-f-]{32,}$/i.test(s)) return true // uuid-ish
      if (/^[a-z]{2}([_-][a-z]{2,3})?$/i.test(s)) return true // locales: en, nl-NL
      if (ROUTING_NOISE.has(s.toLowerCase())) return true
      return false
    }
    const hasLetters = (s: string) => /[a-zA-Z]/.test(s)

    let chosen = ""
    let fallback = ""
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = decodeURIComponent(segments[i]).replace(/\.[a-zA-Z0-9]+$/, "")
      if (isJunk(seg)) continue
      if (hasLetters(seg) && (/[-_]/.test(seg) || seg.length > 4)) {
        chosen = seg
        break
      }
      if (!fallback && hasLetters(seg)) fallback = seg
    }

    const raw = chosen || fallback || urlObj.hostname.replace(/^www\./, "")

    return raw
      .replace(/[-_]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim()
  } catch {
    return ""
  }
}
