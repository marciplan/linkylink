"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { incrementCategoryItemLikes } from "@/lib/actions"
import { cn } from "@/lib/utils"

const key = (id: string) => `bundel-liked:item:${id}`

/** A small heart for a pick. One like per device, counted optimistically. */
export function ItemLike({ itemId, initial, className }: { itemId: string; initial: number; className?: string }) {
  const [count, setCount] = useState(initial)
  const [liked, setLiked] = useState(() => {
    try {
      return localStorage.getItem(key(itemId)) === "1"
    } catch {
      return false
    }
  })

  const like = () => {
    if (liked) return
    setLiked(true)
    setCount((n) => n + 1)
    if (navigator.vibrate) navigator.vibrate(8)
    try {
      localStorage.setItem(key(itemId), "1")
    } catch {}
    incrementCategoryItemLikes(itemId).catch(() => {})
  }

  return (
    <button
      type="button"
      onClick={like}
      aria-pressed={liked}
      aria-label={liked ? `Liked, ${count}` : `Like (${count})`}
      className={cn("pressable inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold tabular-nums", className)}
    >
      <Heart className={cn("h-4 w-4 transition-transform", liked && "scale-110 fill-current")} />
      {count > 0 && count}
    </button>
  )
}
