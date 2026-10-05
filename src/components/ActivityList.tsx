"use client"

import { useEffect } from "react"
import Link from "next/link"
import { FluentEmoji } from "@/components/FluentEmoji"
import { markActivityRead } from "@/lib/sharing-actions"
import { cn } from "@/lib/utils"

export interface ActivityItem {
  id: string
  kind: "VOTE" | "SUGGESTION" | "REMIX" | "COMMENT" | "FOLLOW"
  actorName: string
  bundelTitle: string | null
  bundelPath: string | null
  detail: string | null
  read: boolean
  createdAt: Date
}

const EMOJI: Record<ActivityItem["kind"], string> = { VOTE: "🗳️", SUGGESTION: "💡", REMIX: "📋", COMMENT: "💬", FOLLOW: "🔔" }

function sentence(a: ActivityItem) {
  switch (a.kind) {
    case "VOTE":
      return <><b>{a.actorName}</b> voted for {a.detail ? <>“{a.detail}”</> : "a link"}</>
    case "SUGGESTION":
      return <><b>{a.actorName}</b> suggested {a.detail ? <>“{a.detail}”</> : "a link"}</>
    case "REMIX":
      return <><b>@{a.actorName}</b> saved a copy</>
    case "COMMENT":
      return <><b>@{a.actorName}</b> commented{a.detail ? <>: “{a.detail}”</> : ""}</>
    case "FOLLOW":
      return <><b>Someone</b> followed you by email</>
  }
}

function ago(date: Date) {
  const s = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 1000))
  if (s < 60) return "now"
  if (s < 3600) return `${Math.round(s / 60)}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  return `${Math.round(s / 86400)}d`
}

/** What people did with your Bundels lately. Seen items are marked read. */
export function ActivityList({ items }: { items: ActivityItem[] }) {
  const unread = items.some((a) => !a.read)
  useEffect(() => {
    if (unread) markActivityRead().catch(() => {})
  }, [unread])

  return (
    <section aria-label="Activity" className="rounded-3xl bg-surface shadow-card ring-1 ring-line/50">
      <h2 className="px-4 pt-4 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Activity</h2>
      <ul className="divide-y divide-line/70">
        {items.map((a) => {
          const href = a.kind === "FOLLOW" ? (a.bundelPath?.replace(/\/$/, "") ?? "/account") : a.bundelPath ?? "/dashboard"
          return (
            <li key={a.id}>
              <Link href={href} className="flex items-start gap-3 px-4 py-3 active:bg-ink/5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2">
                  <FluentEmoji emoji={EMOJI[a.kind]} size={22} />
                </span>
                <span className="min-w-0 flex-1 text-[15px] leading-snug">
                  <span className="line-clamp-2 [&_b]:font-semibold">{sentence(a)}</span>
                  {a.kind !== "FOLLOW" && a.bundelTitle && <span className="block truncate text-[13px] text-ink-3">{a.bundelTitle}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-[13px] text-ink-3 tabular-nums">
                  {ago(a.createdAt)}
                  <span className={cn("h-2 w-2 rounded-full", a.read ? "bg-transparent" : "bg-tint")} aria-label={a.read ? undefined : "New"} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
