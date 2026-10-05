import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { BundelIconTile } from "@/components/bundel/BundelHero"
import { bundelIcon } from "@/lib/bundel-icon"
import { bundelGradient, bundelHue } from "@/lib/theme"

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
  const hue = bundelHue(slug)
  const count = isYearReview
    ? `${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`
    : `${linkCount} ${linkCount === 1 ? "link" : "links"}`

  return (
    <Link
      href={`/${username}/${slug}`}
      className="stagger flex min-h-[76px] items-center gap-3.5 px-3.5 py-3 transition-colors active:bg-ink/5 hover:bg-ink/[0.02]"
      style={{ "--i": index } as React.CSSProperties}
    >
      <span className="rounded-[30%] shadow-card" style={{ background: bundelGradient(hue) }}>
        <BundelIconTile icon={bundelIcon(avatar, userImage, title)} size={52} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[16px] font-semibold">{title}</span>
          {isYearReview && year && (
            <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-bg">{year}</span>
          )}
        </span>
        {subtitle && <span className="block truncate text-[14px] text-ink-2">{subtitle}</span>}
        <span className="block text-[13px] text-ink-3 tabular-nums">
          {count} · {views.toLocaleString()} {views === 1 ? "view" : "views"}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" />
    </Link>
  )
}
