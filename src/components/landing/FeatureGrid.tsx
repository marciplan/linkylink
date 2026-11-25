import { FluentEmoji } from "@/components/FluentEmoji"
import { ChatLoop, ThemeCycler, ToolbarSpotlight, VoteTicker, YearCycler } from "./LoopingVisuals"
import { emojiTone } from "@/lib/emoji-tone"
import { toneProps } from "@/lib/tone"
import { cn } from "@/lib/utils"
import { InView } from "./InView"
import { delay, rise } from "./motion"

// "One page for everything you share": six grey cards, each a title, one
// line, and the feature itself drawn underneath, cut off by the card.

function Card({ title, line, children, className }: { title: string; line: string; children: React.ReactNode; className?: string }) {
  return (
    <li className={cn("relative flex h-[360px] flex-col items-center overflow-hidden rounded-[32px] bg-surface-2 px-6 pt-7 text-center md:h-[440px] md:pt-8", className)}>
      <h3 className="text-[22px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-[30ch] text-[15px] text-ink-3 text-pretty">{line}</p>
      <InView className="relative flex w-full flex-1 items-center justify-center">
        <div aria-hidden className="contents">{children}</div>
      </InView>
    </li>
  )
}

/** Positioned by the outer span; the inner one carries the grain, which needs position: relative. */
function Tile({ emoji, className, style, bobDelay = "0s" }: { emoji: string; className?: string; style?: React.CSSProperties; bobDelay?: string }) {
  const tone = emojiTone(emoji)
  return (
    <span className={cn("absolute", className)} style={style}>
      <span className="tone-hero tone-icon grain animate-bob grid h-full w-full place-items-center rounded-[28%] shadow-[0_24px_40px_-18px_rgb(0_0_0/0.45)]" style={{ ...toneProps(tone).style, animationDelay: bobDelay }} data-ink={tone.ink}>
        <FluentEmoji emoji={emoji} size={64} className="!h-[52%] !w-[52%]" />
      </span>
    </span>
  )
}

const fan = "transition-transform duration-[900ms] ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"

/** Three tiles that start stacked in the middle and fan out once in view. */
function FannedTiles() {
  return (
    <div className="relative h-36 w-64">
      <Tile emoji="🎧" bobDelay="-1.5s" className={`left-1/2 top-4 h-28 w-28 [transform:translateX(-50%)_scale(0.9)] group-data-[inview=true]/inview:[transform:translateX(-118%)_rotate(-12deg)] motion-reduce:[transform:translateX(-118%)_rotate(-12deg)] ${fan}`} style={delay(250)} />
      <Tile emoji="🎁" bobDelay="-3s" className={`left-1/2 top-4 h-28 w-28 [transform:translateX(-50%)_scale(0.9)] group-data-[inview=true]/inview:[transform:translateX(18%)_rotate(12deg)] motion-reduce:[transform:translateX(18%)_rotate(12deg)] ${fan}`} style={delay(250)} />
      <Tile emoji="✈️" className={`left-1/2 top-0 z-10 h-32 w-32 [transform:translateX(-50%)_scale(0.85)] group-data-[inview=true]/inview:[transform:translateX(-50%)] motion-reduce:[transform:translateX(-50%)] ${fan}`} />
    </div>
  )
}

const THEMES = [
  { emoji: "🍝", title: "Pasta nights", meta: "@lotte · 6 recipes", rows: [["Cacio e pepe", "bonappetit.com"], ["Carbonara the Roman way", "seriouseats.com"], ["Lemon ricotta pasta", "nytimes.com"]] },
  { emoji: "🎧", title: "Songs for the drive", meta: "@joris · 9 links", rows: [["Fred again.. Boiler Room", "youtube.com"], ["Bon Iver, live at AIR", "spotify.com"], ["Four Tet Essential Mix", "soundcloud.com"]] },
  { emoji: "🏖️", title: "Beach days", meta: "@noor · 5 links", rows: [["Beach club in Zandvoort", "tripadvisor.com"], ["Surf lesson in Scheveningen", "airbnb.com"], ["Picnic spot, Bloemendaal", "google.com"]] },
].map((t) => ({ ...t, rows: t.rows.map(([title, domain]) => ({ title, domain })) }))

const YEAR = [
  { emoji: "🎬", name: "Films", picks: ["Past Lives", "Perfect Days", "Dune: Part Two"] },
  { emoji: "💿", name: "Albums", picks: ["Blond", "Carrie & Lowell", "In Rainbows"] },
  { emoji: "📍", name: "Places", picks: ["Lisbon", "Kyoto", "Ghent"] },
]

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8 lg:pb-28">
      <h2 className="mx-auto max-w-[16ch] text-center text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-balance">
        One page for everything you share.
      </h2>
      <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Paste any link" line="The title and icon fill themselves in.">
          <FannedTiles />
        </Card>
        <Card title="Its own look" line="Every Bundel gets its own colours. No design work.">
          <div className={`absolute inset-0 flex items-center justify-center ${rise}`}>
            <ThemeCycler themes={THEMES.map((t) => ({ ...t, tone: emojiTone(t.emoji) }))} />
          </div>
        </Card>
        <Card title="Vote together" line="Friends pick a favourite. No account needed.">
          <div className={`absolute inset-x-0 bottom-0 flex justify-center ${rise}`}>
            <VoteTicker tone={emojiTone("✈️")} />
          </div>
        </Card>
        <Card title="Great in the chat" line="A proper preview in every group chat.">
          <ChatLoop tone={emojiTone("🏡")} />
        </Card>
        <Card title="Rank your year" line="Share each category as a Story.">
          <div className={`absolute inset-0 flex items-center justify-center ${rise}`}>
            <YearCycler categories={YEAR.map((c) => ({ ...c, tone: emojiTone(c.emoji) }))} />
          </div>
        </Card>
        <Card title="Save from anywhere" line="Share sheet, paste, your AI, or a Pocket import.">
          <ToolbarSpotlight />
        </Card>
      </ul>
    </section>
  )
}
