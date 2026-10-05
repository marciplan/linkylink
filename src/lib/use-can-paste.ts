import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/** Whether the browser lets us read the clipboard on a tap (false during SSR). */
export function useCanPaste() {
  return useSyncExternalStore(
    subscribe,
    () => typeof navigator !== "undefined" && !!navigator.clipboard?.readText,
    () => false
  )
}
