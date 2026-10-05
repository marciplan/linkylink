"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"

// Client-side split point: only Bundels in Ask mode download the voting UI.
export const AskVisitorList = dynamic(() => import("./ask/AskVisitorList"))

/** Brings a shared link (?l=…) into view once the page has painted. */
export function FocusLink({ id }: { id: string }) {
  useEffect(() => {
    const el = document.getElementById(`l-${id}`)
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const t = setTimeout(() => el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }), 250)
    return () => clearTimeout(t)
  }, [id])
  return null
}
