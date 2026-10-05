import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimitHeaders } from "@/lib/rate-limit"
import { domainOf, titleFromUrl } from "@/lib/links"

// Reads a page's title, site name and icon so adding a link is just pasting it.

const MAX_BYTES = 512 * 1024
const PRIVATE_HOST = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim()
}

function meta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
      "i"
    )
    const m = html.match(re)
    const value = m?.[1] ?? m?.[2]
    if (value) return decodeEntities(value)
  }
  return null
}

function iconHref(html: string, base: URL): string | null {
  const links = html.match(/<link[^>]+>/gi) ?? []
  const ranked = ["apple-touch-icon", "icon", "shortcut icon"]
  for (const rel of ranked) {
    for (const tag of links) {
      const relMatch = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase()
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
      if (relMatch === rel && href) {
        try {
          return new URL(href, base).toString()
        } catch {}
      }
    }
  }
  return null
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = rateLimitHeaders(request, "unfurl", 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(rl.body, { status: rl.status, headers: rl.headers })
  }

  const raw = new URL(request.url).searchParams.get("url")
  let target: URL
  try {
    target = new URL(raw ?? "")
    if (!["http:", "https:"].includes(target.protocol) || PRIVATE_HOST.test(target.hostname)) throw new Error()
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  const fallback = {
    url: target.toString(),
    title: titleFromUrl(target.toString()),
    siteName: domainOf(target.toString()),
    description: null as string | null,
    favicon: null as string | null,
  }

  try {
    // Follow redirects by hand so every hop gets the same host check.
    let res: Response | null = null
    let current = target
    const signal = AbortSignal.timeout(6000)
    for (let hop = 0; hop < 4; hop++) {
      res = await fetch(current, {
        redirect: "manual",
        signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BundelBot/1.0; +https://bundel.link)",
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        },
      })
      const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null
      if (!location) break
      current = new URL(location, current)
      if (!["http:", "https:"].includes(current.protocol) || PRIVATE_HOST.test(current.hostname)) {
        return NextResponse.json(fallback, { headers: rl.headers })
      }
      res = null
    }
    if (!res) return NextResponse.json(fallback, { headers: rl.headers })
    const type = res.headers.get("content-type") ?? ""
    if (!res.ok || !res.body || !type.includes("html")) {
      return NextResponse.json(fallback, { headers: rl.headers })
    }

    // Only the <head> matters; stop reading after a bounded amount of bytes.
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let html = ""
    let bytes = 0
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      html += decoder.decode(value, { stream: true })
      if (/<\/head>/i.test(html)) break
    }
    reader.cancel().catch(() => {})

    const finalUrl = current
    const title =
      meta(html, ["og:title", "twitter:title"]) ??
      (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ? decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)![1]) : null)

    return NextResponse.json(
      {
        url: target.toString(),
        title: title?.slice(0, 100) || fallback.title,
        siteName: meta(html, ["og:site_name", "application-name"]) ?? fallback.siteName,
        description: meta(html, ["og:description", "description", "twitter:description"])?.slice(0, 280) ?? null,
        favicon: iconHref(html, finalUrl),
      },
      { headers: rl.headers }
    )
  } catch {
    return NextResponse.json(fallback, { headers: rl.headers })
  }
}
