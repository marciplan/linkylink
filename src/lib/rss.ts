import { appUrl } from "@/lib/email"

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!)

export interface FeedItem {
  id: string
  title: string
  url: string
  description: string
  date: Date
}

/** RSS 2.0 so anyone can follow a curator or a Bundel in their reader, no account needed. */
export function rssResponse({ title, description, path, items }: { title: string; description: string; path: string; items: FeedItem[] }) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(title)}</title>
<link>${esc(appUrl(path))}</link>
<description>${esc(description)}</description>
<atom:link href="${esc(appUrl(path + "/feed.xml"))}" rel="self" type="application/rss+xml"/>
${items
  .map(
    (i) => `<item>
<title>${esc(i.title)}</title>
<link>${esc(i.url)}</link>
<guid isPermaLink="false">${esc(i.id)}</guid>
<pubDate>${i.date.toUTCString()}</pubDate>
<description>${esc(i.description)}</description>
</item>`
  )
  .join("\n")}
</channel>
</rss>`
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900" },
  })
}
