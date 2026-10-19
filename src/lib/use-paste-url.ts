"use client"

import { useEffect, useRef } from "react"
import { findUrl, isProbablyUrl, normalizeUrl } from "@/lib/links"

/**
 * Calls `onUrl` when someone pastes a link anywhere on the page (outside a text field)
 * or drops one onto it. Meant for desktop, where "copy a link, switch tab, press ⌘V" is
 * the fastest way to add something.
 */
export function usePasteUrl(onUrl: (url: string) => void, enabled = true) {
  const handler = useRef(onUrl)
  useEffect(() => {
    handler.current = onUrl
  }, [onUrl])

  useEffect(() => {
    if (!enabled) return

    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && !!el.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")
    const overlayOpen = () => !!document.querySelector("[role=dialog]")

    const pick = (text: string | undefined) => {
      const value = text?.trim()
      if (!value) return null
      if (isProbablyUrl(value)) return normalizeUrl(value)
      return findUrl(value)
    }

    const onPaste = (e: ClipboardEvent) => {
      if (typing(e.target) || overlayOpen()) return
      const url = pick(e.clipboardData?.getData("text"))
      if (!url) return
      e.preventDefault()
      handler.current(url)
    }
    const hasLink = (e: DragEvent) => !!e.dataTransfer && (e.dataTransfer.types.includes("text/uri-list") || e.dataTransfer.types.includes("text/plain"))
    const onDragOver = (e: DragEvent) => {
      if (hasLink(e) && !overlayOpen()) e.preventDefault()
    }
    const onDrop = (e: DragEvent) => {
      if (typing(e.target) || overlayOpen() || !e.dataTransfer) return
      const url = pick(e.dataTransfer.getData("text/uri-list").split("\n")[0] || e.dataTransfer.getData("text/plain"))
      if (!url) return
      e.preventDefault()
      handler.current(url)
    }

    document.addEventListener("paste", onPaste)
    document.addEventListener("dragover", onDragOver)
    document.addEventListener("drop", onDrop)
    return () => {
      document.removeEventListener("paste", onPaste)
      document.removeEventListener("dragover", onDragOver)
      document.removeEventListener("drop", onDrop)
    }
  }, [enabled])
}
