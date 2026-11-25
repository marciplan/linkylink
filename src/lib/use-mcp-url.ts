"use client"

import { useSyncExternalStore } from "react"

const noSubscribe = () => () => {}

/** An MCP URL on whatever host the page is served from (production, a preview, a tunnel). */
export function useMcpUrl(path: string) {
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "https://www.bundel.link")
  return `${origin}${path}`
}
