"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { createYearReview } from "@/lib/actions"
import { bundelGradient, bundelHue } from "@/lib/theme"
import { generateSlug } from "@/lib/utils"

export default function CreateYearReviewPage() {
  const router = useRouter()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [titleEdit, setTitleEdit] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const title = titleEdit ?? `My ${year}`
  const hue = bundelHue(generateSlug(title) || "year-review")

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || creating) return
    setCreating(true)
    try {
      const review = await createYearReview({ title: title.trim().slice(0, 100), year })
      router.push(`/${review.user.username}/${review.slug}`)
    } catch {
      toast.error("Couldn't start your review. Try again?")
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-10 pt-safe">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-3">
          <Link href="/create" aria-label="Back" className="pressable grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-ink-2">
            <X className="h-5 w-5" />
          </Link>
          <p className="text-[15px] font-semibold">Year in review</p>
          <span className="w-10" />
        </div>
      </header>

      <form onSubmit={create} className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-safe">
        <div className="grain relative mt-2 overflow-hidden rounded-4xl p-6 text-white shadow-float" style={{ background: bundelGradient(hue) }}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/5 to-black/45" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80">The year in review</p>
          <div className="my-2 flex items-center justify-between">
            <button type="button" aria-label="Previous year" onClick={() => setYear((y) => Math.max(2000, y - 1))} className="pressable grid h-11 w-11 place-items-center rounded-full bg-white/20 ring-1 ring-white/30">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="font-black leading-none tracking-[-0.06em] tabular-nums [text-shadow:0_6px_30px_rgb(0_0_0/0.25)]" style={{ fontSize: "clamp(3.75rem, 19vw, 6rem)" }} aria-live="polite">
              {year}
            </p>
            <button type="button" aria-label="Next year" onClick={() => setYear((y) => Math.min(thisYear + 1, y + 1))} className="pressable grid h-11 w-11 place-items-center rounded-full bg-white/20 ring-1 ring-white/30">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <label htmlFor="review-title" className="sr-only">
            Title
          </label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitleEdit(e.target.value)}
            maxLength={100}
            enterKeyHint="go"
            placeholder="Name your review"
            className="mt-3 border-0 bg-white/20 text-center text-[20px] font-bold text-white placeholder:text-white/60 focus:bg-white/25 focus:ring-white/30"
          />
        </div>

        <p className="mt-5 px-2 text-center text-[15px] text-ink-2 text-pretty">
          Rank your favourite albums, films, places and more. You can pick your categories next.
        </p>

        <div className="flex-1" />
        <div className="sticky bottom-0 bg-gradient-to-t from-bg via-bg to-bg/0 pb-3 pt-6">
          <Button type="submit" variant="primary" size="lg" disabled={!title.trim() || creating}>
            {creating && <Loader2 className="h-5 w-5 animate-spin" />}
            {creating ? "Starting…" : `Start my ${year}`}
          </Button>
        </div>
      </form>
    </div>
  )
}
