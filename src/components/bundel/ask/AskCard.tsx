"use client"

import { useState } from "react"
import { Lightbulb, Settings2 } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { defaultQuestion, totalVotes, useAsk } from "./AskProvider"
import { SuggestSheet } from "./SuggestSheet"

/** The question at the top of an Ask Bundel, with the running tally. */
export function AskCard({ titles, onEdit }: { titles: Record<string, string>; onEdit?: () => void }) {
  const { ask, summary, ownerName, readOnly } = useAsk()
  const [suggesting, setSuggesting] = useState(false)
  const total = totalVotes(summary)
  const voters = new Set(Object.values(summary).flatMap((v) => v.names)).size
  const leader = Object.entries(summary).sort((a, b) => b[1].count - a[1].count)[0]
  const leaderTitle = leader && leader[1].count > 0 ? titles[leader[0]] : null

  const status = ask.closed
    ? leaderTitle
      ? `Voting closed · “${leaderTitle}” won`
      : "Voting closed"
    : total === 0
      ? ask.kind === "PICK_ONE" ? "Tap Vote on your favourite" : "Vote for as many as you like"
      : `${voters} ${voters === 1 ? "person has" : "people have"} voted${leaderTitle ? ` · “${leaderTitle}” leads` : ""}`

  return (
    <section className="animate-rise rounded-3xl bg-tint-soft p-4 text-tint-ink">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface/70">
          <FluentEmoji emoji="🗳️" size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold opacity-80">@{ownerName} asks</p>
          <h2 className="text-[19px] font-bold leading-snug text-balance">{ask.question || defaultQuestion(ask.kind)}</h2>
          <p className="mt-1 text-[14px] opacity-80 text-pretty">{status}</p>
        </div>
        {onEdit && (
          <button onClick={onEdit} aria-label="Ask settings" className="pressable grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface/70">
            <Settings2 className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
      {!readOnly && ask.allowSuggestions && !ask.closed && (
        <>
          <button
            onClick={() => setSuggesting(true)}
            className="pressable mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-surface/70 text-[15px] font-semibold"
          >
            <Lightbulb className="h-4 w-4" />
            Suggest another option
          </button>
          <SuggestSheet open={suggesting} onOpenChange={setSuggesting} />
        </>
      )}
    </section>
  )
}
