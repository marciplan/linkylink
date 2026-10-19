"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(min-width: 1024px)"

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** True from the `lg` breakpoint up. False on the server, so phones never render desktop-only parts. */
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}

/** Renders children only on desktop-width screens. Pair with `next/dynamic` to keep the code off phones. */
export function DesktopOnly({ children }: { children: React.ReactNode }) {
  return useIsDesktop() ? <>{children}</> : null
}
