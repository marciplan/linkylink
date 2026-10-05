import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { domainOf } from "@/lib/links"
import { bundelHue, oklchToHex } from "@/lib/theme"
import { categoryEmoji, categoryHue, categoryLabel, RANK_EMOJI, WORST_EMOJI } from "@/lib/year-review"
import { ogFonts } from "../../fonts"

export const runtime = "nodejs"

// A 9:16 image of one Year Review category, made for Instagram and WhatsApp Stories.

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text)

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categoryId = request.nextUrl.searchParams.get("c")

  const review = await prisma.linkLink.findUnique({
    where: { slug },
    select: {
      title: true,
      year: true,
      type: true,
      user: { select: { username: true } },
      categories: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, icon: true, categoryType: true, rankLimit: true, items: { orderBy: { rank: "asc" }, select: { id: true, title: true, url: true, rank: true } } },
      },
    },
  })
  if (!review || review.type !== "YEAR_REVIEW") return new Response("Not found", { status: 404 })

  const index = Math.max(0, review.categories.findIndex((c) => c.id === categoryId))
  const category = review.categories[index]
  if (!category) return new Response("Not found", { status: 404 })

  const label = review.year ? `MY ${review.year}` : "MY YEAR"
  const best = category.categoryType === "BEST"
  const hue = categoryHue(bundelHue(slug), index)
  const background = best
    ? `linear-gradient(165deg, ${oklchToHex(0.6, 0.2, hue)} 0%, ${oklchToHex(0.4, 0.17, (hue + 38) % 360)} 100%)`
    : `linear-gradient(165deg, ${oklchToHex(0.3, 0.045, hue)} 0%, ${oklchToHex(0.17, 0.03, (hue + 30) % 360)} 100%)`
  const items = category.items.slice(0, 5)
  const [first, ...rest] = items
  const medals = best ? RANK_EMOJI : WORST_EMOJI

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundImage: background, color: "white", fontFamily: "Inter", padding: "120px 84px 110px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 34, fontWeight: 600, letterSpacing: 8, opacity: 0.85 }}>
          <span>{label}</span>
          <span>{review.title.trim().toUpperCase() === label ? "" : clip(review.title, 22).toUpperCase()}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 90 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 210, height: 210, borderRadius: 66, background: "rgba(255,255,255,0.18)", fontSize: 128 }}>
            {categoryEmoji(category.icon)}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 600, letterSpacing: 7, opacity: 0.8, marginTop: 56 }}>
            {categoryLabel(category).toUpperCase()}
          </div>
          <div style={{ display: "flex", fontSize: category.name.length > 12 ? 124 : 160, fontWeight: 800, letterSpacing: -5, lineHeight: 1, marginTop: 10 }}>
            {clip(category.name, 18)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          {first && (
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.16)", borderRadius: 56, padding: "44px 48px", marginBottom: 24 }}>
              <div style={{ display: "flex", fontSize: 108, marginRight: 40 }}>{medals[0]}</div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", fontSize: first.title.length > 22 ? 62 : 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{clip(first.title, 38)}</div>
                <div style={{ display: "flex", fontSize: 34, opacity: 0.75, marginTop: 10 }}>{domainOf(first.url)}</div>
              </div>
            </div>
          )}
          {rest.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "20px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 76, fontSize: medals[item.rank - 1] ? 60 : 44, fontWeight: 700, opacity: medals[item.rank - 1] ? 1 : 0.7, marginRight: 28 }}>
                {medals[item.rank - 1] ?? item.rank}
              </div>
              <div style={{ display: "flex", fontSize: 50, fontWeight: 600, letterSpacing: -1 }}>{clip(item.title, 30)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 56, fontSize: 36, fontWeight: 600, opacity: 0.9 }}>
          <span>@{review.user.username}</span>
          <span style={{ display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: 12 }}>🔗</span>
            bundel.link
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      emoji: "fluent",
      fonts: await ogFonts(),
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=900, stale-while-revalidate=86400" },
    }
  )
}
