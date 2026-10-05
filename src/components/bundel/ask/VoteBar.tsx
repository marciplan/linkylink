"use client"

import { Check, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { totalVotes, useAsk } from "./AskProvider"

function names(list: string[]) {
  if (list.length === 0) return ""
  if (list.length <= 2) return list.join(" & ")
  return `${list.slice(0, 2).join(", ")} +${list.length - 2}`
}

/** Result bar and vote toggle shown under each link of an Ask Bundel. */
export function VoteBar({ linkId, title }: { linkId: string; title: string }) {
  const { summary, mine, vote, ask, readOnly } = useAsk()
  const entry = summary[linkId] ?? { count: 0, names: [] }
  const total = totalVotes(summary)
  const pct = total ? Math.round((entry.count / total) * 100) : 0
  const voted = mine.includes(linkId)
  const top = Math.max(0, ...Object.values(summary).map((v) => v.count))
  const leading = entry.count > 0 && entry.count === top

  return (
    <div className="flex items-center gap-3 px-4 pb-4">
      <div className="min-w-0 flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden>
          <div
            className={cn("h-full rounded-full transition-[width] duration-500 ease-out", leading ? "bg-tint" : "bg-tint/45")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-[13px] text-ink-3">
          {ask.closed && leading && <Trophy className="h-3.5 w-3.5 shrink-0 text-tint-ink" />}
          <span className="font-semibold tabular-nums text-ink-2">
            {entry.count} {entry.count === 1 ? "vote" : "votes"}
          </span>
          {entry.names.length > 0 && <span className="truncate">· {names(entry.names)}</span>}
        </p>
      </div>
      {!readOnly && !ask.closed && (
        <button
          type="button"
          onClick={() => vote(linkId)}
          aria-pressed={voted}
          aria-label={voted ? `Remove your vote for ${title}` : `Vote for ${title}`}
          className={cn(
            "pressable inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold",
            voted ? "bg-tint-strong text-white" : "bg-tint-soft text-tint-ink"
          )}
        >
          {voted && <Check className="h-4 w-4" strokeWidth={3} />}
          {voted ? "Voted" : "Vote"}
        </button>
      )}
    </div>
  )
}
