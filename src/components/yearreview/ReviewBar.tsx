"use client"

import { useState } from "react"
import { Loader2, Share, Smartphone } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { buttonStyles } from "@/components/ui/button"
import { FluentEmoji } from "@/components/FluentEmoji"
import { shareImage, shareOrCopy } from "@/lib/share"
import { categoryEmoji } from "@/lib/year-review"

interface ReviewBarProps {
  slug: string
  title: string
  year: number | null
  username: string
  categories: { id: string; name: string; icon: string; itemCount: number }[]
}

/** Thumb-zone actions on a Year Review: share the page, or share a category as a Story image. */
export function ReviewBar({ slug, title, year, username, categories }: ReviewBarProps) {
  const [storiesOpen, setStoriesOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const shareable = categories.filter((c) => c.itemCount > 0)

  const share = async (c: ReviewBarProps["categories"][number]) => {
    setBusy(c.id)
    await shareImage({
      imageUrl: `/api/og/story/${slug}?c=${c.id}`,
      filename: `${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${year ?? "review"}.png`,
      title: `${c.name} · ${title}`,
      text: `${window.location.origin}/${username}/${slug}`,
    })
    setBusy(null)
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-safe">
        <div className="glass pointer-events-auto mb-1 flex w-full max-w-sm items-center gap-2 rounded-full border border-line/60 p-1.5 shadow-float">
          {shareable.length > 0 && (
            <button onClick={() => setStoriesOpen(true)} className={buttonStyles({ variant: "ghost", size: "md", className: "flex-1 text-ink" })}>
              <Smartphone className="h-4 w-4" />
              Story
            </button>
          )}
          <button
            onClick={() => shareOrCopy({ title, text: `My ${year ?? ""} in review`.trim(), url: window.location.href })}
            className={buttonStyles({ variant: "tint", size: "md", className: "flex-1" })}
          >
            <Share className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      <Sheet open={storiesOpen} onOpenChange={setStoriesOpen} title="Share as a Story" description="A vertical image made for Instagram and WhatsApp Stories.">
        <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl bg-surface-2/70">
          {shareable.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => share(c)}
                disabled={!!busy}
                className="flex min-h-[60px] w-full items-center gap-3 px-4 text-left active:bg-ink/5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
                  <FluentEmoji emoji={categoryEmoji(c.icon)} size={26} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">{c.name}</span>
                {busy === c.id ? <Loader2 className="h-5 w-5 animate-spin text-ink-3" /> : <Share className="h-5 w-5 text-ink-3" />}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  )
}
