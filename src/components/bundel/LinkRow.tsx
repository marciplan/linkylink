import { Heart, MessageCircle, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { domainOf } from "@/lib/links"
import { linkFacts } from "@/lib/link-facts"
import { Favicon } from "./Favicon"
import { LinkImage } from "./LinkImage"

export interface BundelLink {
  id: string
  title: string
  url: string
  favicon: string | null
  /** og:image; "" when the site has none, null while not looked up yet. */
  image?: string | null
  context: string | null
  likes?: number
  order?: number
}

/** The first few links that have a preview image show it; the rest stay compact so the list scans. */
const FEATURED_LINKS = 3

export function featuredLinkIds(links: Pick<BundelLink, "id" | "image">[]): Set<string> {
  return new Set(links.filter((l) => l.image).slice(0, FEATURED_LINKS).map((l) => l.id))
}

interface LinkRowBodyProps {
  link: BundelLink
  commentCount?: number
  /** Leave room on the right for an overlaid action button. */
  reserveAction?: boolean
  /** Show the link's preview image, when it has one. */
  featured?: boolean
}

/** Price, was-price, percent off and rating, pulled from the title and note. */
function FactChips({ title, context }: { title: string; context: string | null }) {
  const facts = linkFacts(title, context)
  if (!facts.price && !facts.rating) return null
  return (
    <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold tabular-nums">
      {facts.price && (
        <span className="inline-flex items-baseline gap-1.5 rounded-full bg-tint-soft px-2.5 py-0.5 text-tint-ink">
          {facts.price}
          {facts.was && <s className="font-medium text-ink-3 decoration-1">{facts.was}</s>}
        </span>
      )}
      {facts.off && (
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">−{facts.off}%</span>
      )}
      {facts.rating && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">
          <Star className="h-3 w-3 fill-current" strokeWidth={0} />
          {facts.rating}
        </span>
      )}
    </span>
  )
}

/** The visual content of a link row, shared by the visitor and owner views. */
export function LinkRowBody({ link, commentCount = 0, reserveAction = true, featured = false }: LinkRowBodyProps) {
  const likes = link.likes ?? 0
  const image = featured && link.image ? link.image : null
  return (
    <span className="block">
      <span className={cn("flex items-start gap-3.5", reserveAction && "pr-10")}>
        <Favicon url={link.url} favicon={link.favicon} />
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="line-clamp-2 text-[16px] font-semibold leading-snug text-ink text-pretty">{link.title}</span>
          <span className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-3">
            <span className="truncate">{domainOf(link.url)}</span>
            {likes > 0 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums">
                <Heart className="h-3 w-3" strokeWidth={2.5} />
                {likes}
              </span>
            )}
            {commentCount > 0 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums">
                <MessageCircle className="h-3 w-3" strokeWidth={2.5} />
                {commentCount}
              </span>
            )}
          </span>
          <FactChips title={link.title} context={link.context} />
        </span>
      </span>
      {image && <LinkImage key={image} src={image} className="mt-3.5" />}
      {link.context && (
        <span className={cn("mt-3 block border-l-2 border-tint/50 pl-3 text-[14.5px] leading-snug text-ink-2 text-pretty", !image && "ml-[58px]")}>
          {link.context}
        </span>
      )}
    </span>
  )
}
