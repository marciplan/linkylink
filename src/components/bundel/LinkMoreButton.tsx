"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { MoreHorizontal } from "lucide-react"
import type { BundelLink } from "./LinkRow"
import type { LinkSheetProps } from "./LinkSheet"

// The sheet (and its drawer library) only loads once a visitor actually asks for it.
const LinkSheet = dynamic(() => import("./LinkSheet").then((m) => m.LinkSheet), { ssr: false })

type Props = Omit<LinkSheetProps, "open" | "onOpenChange"> & { link: BundelLink }

export function LinkMoreButton(props: Props) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLoaded(true)
          setOpen(true)
        }}
        aria-label={`More about ${props.link.title}`}
        className="pressable absolute right-2.5 top-2.5 grid h-10 w-10 place-items-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {loaded && <LinkSheet {...props} open={open} onOpenChange={setOpen} />}
    </>
  )
}
