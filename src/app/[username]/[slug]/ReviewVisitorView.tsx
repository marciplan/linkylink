import Link from "next/link"
import { Link2, Share } from "lucide-react"
import { TopBar } from "@/components/bundel/TopBar"
import { topBarButton } from "@/components/bundel/styles"
import { ShareButton } from "@/components/bundel/ShareButton"
import { ConfettiOnView } from "@/components/bundel/lazy"
import { YearHero } from "@/components/yearreview/YearHero"
import { CategoryCard, type ReviewCategory } from "@/components/yearreview/CategoryCard"
import { ReviewBar } from "@/components/yearreview/ReviewBar"
import { bundelHue } from "@/lib/theme"
import { categoryHue, reviewBarTitle } from "@/lib/year-review"

interface ReviewVisitorViewProps {
  review: {
    id: string
    slug: string
    title: string
    subtitle: string | null
    headerImage: string | null
    year: number | null
    user: { username: string; name: string | null }
    categories: ReviewCategory[]
  }
  /** Set when the owner is previewing their own page. */
  previewHref?: string
}

/** A Year Review as visitors see it: the year, then one poster-style card per category. */
export function ReviewVisitorView({ review, previewHref }: ReviewVisitorViewProps) {
  const hue = bundelHue(review.slug)
  const filled = review.categories.filter((c) => c.items.length > 0)
  const picks = review.categories.reduce((n, c) => n + c.items.length, 0)

  return (
    <div data-tint style={{ "--tint-h": hue } as React.CSSProperties} className="min-h-dvh bg-bg">
      <style>{`:root{--tint-h:${hue}}`}</style>
      <TopBar
        title={reviewBarTitle(review.title, review.year)}
        leading={
          previewHref ? (
            <Link href={previewHref} className={topBarButton}>
              Done
            </Link>
          ) : (
            <Link href="/" className={`${topBarButton} gap-1.5`} aria-label="Bundel home">
              <Link2 className="h-4 w-4" strokeWidth={2.5} />
              <span className="pr-0.5">Bundel</span>
            </Link>
          )
        }
        trailing={
          <ShareButton title={review.title} text={review.subtitle} className={topBarButton} aria-label="Share this review">
            <Share className="h-[18px] w-[18px]" />
          </ShareButton>
        }
      />

      <YearHero
        hue={hue}
        year={review.year}
        headerImage={review.headerImage}
        title={review.title}
        subtitle={review.subtitle}
        meta={
          <>
            <Link href={`/${review.user.username}`} className="underline decoration-white/40 underline-offset-4">
              @{review.user.username}
            </Link>
            <span aria-hidden>·</span>
            <span>
              {review.categories.length} {review.categories.length === 1 ? "category" : "categories"}
            </span>
            <span aria-hidden>·</span>
            <span>
              {picks} {picks === 1 ? "pick" : "picks"}
            </span>
          </>
        }
      />
      <div id="hero-end" aria-hidden />

      <main className="relative -mt-7 rounded-t-4xl bg-bg pb-40 pt-5">
        <div className="mx-auto max-w-2xl space-y-4 px-4">
          {review.categories.length === 0 ? (
            <p className="py-16 text-center text-ink-3">Nothing here yet.</p>
          ) : (
            review.categories.map((category, i) => (
              <CategoryCard key={category.id} category={category} hue={categoryHue(hue, i)} index={i} />
            ))
          )}
          <p className="pt-8 text-center text-sm text-ink-3">
            Made by{" "}
            <Link href={`/${review.user.username}`} className="font-semibold text-ink-2 underline-offset-4 hover:underline">
              @{review.user.username}
            </Link>{" "}
            with{" "}
            <Link href="/" className="font-semibold text-ink-2 underline-offset-4 hover:underline">
              Bundel
            </Link>
          </p>
        </div>
      </main>

      {filled.length > 0 && <ConfettiOnView targetId="first-pick" hue={hue} />}
      {!previewHref && (
        <ReviewBar
          slug={review.slug}
          title={review.title}
          year={review.year}
          username={review.user.username}
          categories={review.categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, itemCount: c.items.length }))}
        />
      )}
    </div>
  )
}
