"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy as CopyIcon, Loader2, Share } from "lucide-react"
import { buttonStyles } from "@/components/ui/button"
import { duplicateBundel } from "@/lib/actions"
import { shareOrCopy } from "@/lib/share"

interface VisitorBarProps {
  bundelId: string
  title: string
  subtitle?: string | null
  isSignedIn: boolean
  /** Path of this page, used to come back after signing in. */
  path: string
}

/** Thumb-zone actions for visitors: share this Bundel, or keep a copy of it. */
export function VisitorBar({ bundelId, title, subtitle, isSignedIn, path }: VisitorBarProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const saveCopy = async () => {
    if (!isSignedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(path)}`)
      return
    }
    setSaving(true)
    try {
      const copy = await duplicateBundel(bundelId)
      toast("Saved to your Bundels", {
        action: { label: "Open", onClick: () => router.push(`/${copy.username}/${copy.slug}`) },
      })
    } catch {
      toast.error("Couldn't save a copy")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-safe">
      <div className="glass pointer-events-auto mb-1 flex w-full max-w-sm items-center gap-2 rounded-full border border-line/60 p-1.5 shadow-float">
        <button onClick={saveCopy} disabled={saving} className={buttonStyles({ variant: "ghost", size: "md", className: "flex-1 text-ink" })}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyIcon className="h-4 w-4" />}
          Save a copy
        </button>
        <button
          onClick={() => shareOrCopy({ title, text: subtitle || undefined, url: window.location.href })}
          className={buttonStyles({ variant: "tint", size: "md", className: "flex-1" })}
        >
          <Share className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  )
}
