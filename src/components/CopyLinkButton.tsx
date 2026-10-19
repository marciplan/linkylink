"use client"

import { useState } from "react"
import { Check, Link2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/** Copies a Bundel's public link. Shown on hover in desktop cards. */
export function CopyLinkButton({ path, className }: { path: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopied(true)
      toast("Link copied")
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Couldn't copy. Open the Bundel and share it from there.")
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy link"
      title="Copy link"
      className={cn("pressable grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-ink-2 hover:bg-ink/10 hover:text-ink", className)}
    >
      {copied ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Link2 className="h-4 w-4" />}
    </button>
  )
}
