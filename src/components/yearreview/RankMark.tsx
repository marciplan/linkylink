import { FluentEmoji } from "@/components/FluentEmoji"
import { RANK_EMOJI, WORST_EMOJI } from "@/lib/year-review"
import { cn } from "@/lib/utils"

/** 🥇🥈🥉 for the podium, numerals after that. Worst-of cards get their own cheeky set. */
export function RankMark({ rank, type, size = 32 }: { rank: number; type: "BEST" | "WORST"; size?: number }) {
  const set = type === "BEST" ? RANK_EMOJI : WORST_EMOJI
  const emoji = set[rank - 1]
  if (emoji) {
    return (
      <span className="grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Number ${rank}`}>
        <FluentEmoji emoji={emoji} size={size} />
      </span>
    )
  }
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-bold tabular-nums text-white/90 ring-1 ring-white/25", "bg-white/10")}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-label={`Number ${rank}`}
    >
      {rank}
    </span>
  )
}
