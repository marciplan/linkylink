import { Heart, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { domainOf } from "@/lib/links"
import { Favicon } from "./Favicon"

export interface BundelLink {
  id: string
  title: string
  url: string
  favicon: string | null
  context: string | null
  likes?: number
  order?: number
}

interface LinkRowBodyProps {
  link: BundelLink
  commentCount?: number
  /** Leave room on the right for an overlaid action button. */
  reserveAction?: boolean
}

/** The visual content of a link row, shared by the visitor and owner views. */
export function LinkRowBody({ link, commentCount = 0, reserveAction = true }: LinkRowBodyProps) {
  const likes = link.likes ?? 0
  return (
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
        {link.context && (
          <span className="mt-2.5 block border-l-2 border-tint/50 pl-3 text-[14.5px] leading-snug text-ink-2 text-pretty">
            {link.context}
          </span>
        )}
      </span>
    </span>
  )
}
