"use client"

import { useEffect } from "react"

/** Marks a .scroll-autohide element while it scrolls, so its scrollbar shows only then. */
export function ScrollbarAutoHide() {
  useEffect(() => {
    const timers = new WeakMap<Element, number>()
    const onScroll = (e: Event) => {
      const el = e.target
      if (!(el instanceof HTMLElement) || !el.classList.contains("scroll-autohide")) return
      el.setAttribute("data-scrolling", "")
      window.clearTimeout(timers.get(el))
      timers.set(el, window.setTimeout(() => el.removeAttribute("data-scrolling"), 900))
    }
    document.addEventListener("scroll", onScroll, { capture: true, passive: true })
    return () => document.removeEventListener("scroll", onScroll, { capture: true })
  }, [])
  return null
}
