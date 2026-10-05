import { FluentEmoji } from "@/components/FluentEmoji"
import { Favicon } from "@/components/bundel/Favicon"
import { domainOf } from "@/lib/links"
import { categoryEmoji, categoryLabel } from "@/lib/year-review"
import { cn } from "@/lib/utils"
import { cardBackground, glassPanel, glassRow } from "./card-styles"
import { ItemLike } from "./ItemLike"
import { RankMark } from "./RankMark"

export interface ReviewItem {
  id: string
  title: string
  url: string
  favicon: string | null
  context: string | null
  rank: number
  likes: number
}

export interface ReviewCategory {
  id: string
  name: string
  icon: string
  categoryType: "BEST" | "WORST"
  rankLimit: number
  items: ReviewItem[]
}

/** A category as a poster: the #1 pick large, the rest as a podium list. Server-rendered. */
export function CategoryCard({ category, hue, index }: { category: ReviewCategory; hue: number; index: number }) {
  const [first, ...rest] = category.items

  return (
    <section
      id={`cat-${category.id}`}
      aria-label={category.name}
      className="grain stagger relative scroll-mt-24 overflow-hidden rounded-[32px] p-5 text-white shadow-float"
      style={{ background: cardBackground(hue, category.categoryType), "--i": index } as React.CSSProperties}
    >
      <header className="flex items-center gap-3.5">
        <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-[22px]", glassPanel)}>
          <FluentEmoji emoji={categoryEmoji(category.icon)} size={34} />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {categoryLabel(category)}
          </p>
          <h2 className="truncate text-[24px] font-extrabold leading-tight tracking-tight">{category.name}</h2>
        </div>
      </header>

      {!first ? (
        <p className="mt-5 rounded-2xl bg-white/10 px-4 py-6 text-center text-[15px] text-white/75">Nothing here yet.</p>
      ) : (
        <div className="mt-5 space-y-2">
          <div id={index === 0 ? "first-pick" : undefined} className={cn("relative rounded-3xl", glassPanel)}>
            <a
              href={first.url}
              target="_blank"
              rel="noopener noreferrer"
              ping={`/api/items/${first.id}/click`}
              className="pressable block rounded-3xl p-4 pb-14"
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <Favicon url={first.url} favicon={first.favicon} size={68} className="rounded-[22px] bg-white/25" />
                  <span className="absolute -bottom-2 -right-2 drop-shadow-lg">
                    <RankMark rank={1} type={category.categoryType} size={34} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-3 text-[23px] font-extrabold leading-[1.1] tracking-tight text-pretty">{first.title}</p>
                  <p className="mt-1 truncate text-[14px] text-white/75">{domainOf(first.url)}</p>
                </div>
              </div>
              {first.context && (
                <p className="mt-3.5 border-l-2 border-white/45 pl-3 text-[15px] leading-snug text-white/90 text-pretty">{first.context}</p>
              )}
            </a>
            <ItemLike itemId={first.id} initial={first.likes} className="absolute bottom-2.5 right-3 bg-white/15 text-white" />
          </div>

          {rest.length > 0 && (
            <ol className="space-y-2">
              {rest.map((item) => (
                <li key={item.id} className={cn("relative rounded-2xl", glassRow)}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    ping={`/api/items/${item.id}/click`}
                    className="pressable flex items-center gap-3 rounded-2xl p-3 pr-16"
                  >
                    <RankMark rank={item.rank} type={category.categoryType} size={34} />
                    <Favicon url={item.url} favicon={item.favicon} size={40} className="rounded-[14px] bg-white/20" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-[16px] font-semibold leading-snug">{item.title}</span>
                      {item.context ? (
                        <span className="block truncate text-[13px] text-white/70">{item.context}</span>
                      ) : (
                        <span className="block truncate text-[13px] text-white/60">{domainOf(item.url)}</span>
                      )}
                    </span>
                  </a>
                  <ItemLike itemId={item.id} initial={item.likes} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/85 hover:bg-white/10" />
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}
