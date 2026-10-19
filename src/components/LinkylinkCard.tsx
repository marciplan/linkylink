import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CopyLinkButton } from "@/components/CopyLinkButton"
import { BundelIconTile } from "@/components/bundel/BundelHero"
import { bundelIcon } from "@/lib/bundel-icon"
import { bundelTone } from "@/lib/emoji-tone"

interface LinkylinkCardProps {
  title: string
  subtitle?: string | null
  avatar?: string | null
  userImage?: string | null
  slug: string
  username: string
  linkCount: number
  views: number
  type?: "NORMAL" | "YEAR_REVIEW"
  year?: number | null
  categoryCount?: number
  index?: number
}

/** One Bundel in the Home list: its themed tile, name and a quiet stats line. */
export function LinkylinkCard({
  title,
  subtitle,
  avatar,
  userImage,
  slug,
  username,
  linkCount,
  views,
  type = "NORMAL",
  year,
  categoryCount = 0,
  index = 0,
}: LinkylinkCardProps) {
  const isYearReview = type === "YEAR_REVIEW"
  const icon = bundelIcon(avatar, userImage, title)
  const tone = bundelTone(slug, icon)
  const count = isYearReview
    ? `${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`
    : `${linkCount} ${linkCount === 1 ? "link" : "links"}`

  return (
    <div className="group relative">
      <Link
        href={`/${username}/${slug}`}
        className="stagger flex min-h-[76px] items-center gap-3.5 px-3.5 py-3 transition-colors active:bg-ink/5 hover:bg-ink/[0.02] lg:h-full lg:min-h-[168px] lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-3xl lg:bg-surface lg:p-5 lg:shadow-card lg:ring-1 lg:ring-line/50 lg:transition-[transform,box-shadow] lg:hover:-translate-y-0.5 lg:hover:bg-surface lg:hover:shadow-float"
        style={{ "--i": index } as React.CSSProperties}
      >
        <BundelIconTile icon={icon} tone={tone} size={52} variant="tile" />
        <span className="min-w-0 flex-1 lg:mt-4 lg:flex-none">
          <span className="flex items-center gap-2">
            <span className="truncate text-[16px] font-semibold lg:text-[17px]">{title}</span>
            {isYearReview && year && (
              <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-bg">{year}</span>
            )}
          </span>
          {subtitle && <span className="block truncate text-[14px] text-ink-2 lg:line-clamp-2 lg:whitespace-normal">{subtitle}</span>}
          <span className="block text-[13px] text-ink-3 tabular-nums lg:mt-3">
            {count} · {views.toLocaleString()} {views === 1 ? "view" : "views"}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-3 lg:hidden" />
      </Link>
      <CopyLinkButton
        path={`/${username}/${slug}`}
        className="absolute right-4 top-4 hidden opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 lg:grid"
      />
    </div>
  )
}
