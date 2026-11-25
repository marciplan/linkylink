import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"
import { bundelIcon } from "@/lib/bundel-icon"
import { bundelTone } from "@/lib/emoji-tone"
import { tonePalette } from "@/lib/tone"
import { subBundelIds } from "@/lib/sub-bundels"
import { MARK_COLORS, MarkImage } from "@/lib/brand-mark"
import { ogFonts } from "../../fonts"

// Share image for a curator's page (the link people put in their bio): who
// they are, how much they've collected, and their newest Bundels in their own colours.

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)

export async function GET(_request: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params
  const { base, top } = MARK_COLORS.light
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, name: true, username: true } })
  const hidden = user ? await subBundelIds(user.id) : []
  const bundels = user
    ? await prisma.linkLink.findMany({
        where: { userId: user.id, isPublic: true, id: { notIn: hidden } },
        orderBy: { createdAt: "desc" },
        select: { title: true, slug: true, avatar: true, _count: { select: { links: true } } },
      })
    : []
  const name = user?.name || (user ? `@${user.username}` : "Bundel")
  const linkCount = bundels.reduce((n, b) => n + b._count.links, 0)

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", padding: "72px 72px 100px", background: "radial-gradient(circle at 20% 20%, #ffffff 0%, #eef0f4 75%)", fontFamily: "Inter", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", width: bundels.length ? 560 : 1056, justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: name.length > 18 ? 64 : 78, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.04, color: base }}>{clip(name, 32)}</div>
          {user && <div style={{ display: "flex", fontSize: 32, color: top, marginTop: 12 }}>@{user.username}</div>}
          {user && (
            <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: base, marginTop: 36 }}>
              {bundels.length} {bundels.length === 1 ? "Bundel" : "Bundels"} · {linkCount} {linkCount === 1 ? "link" : "links"}
            </div>
          )}
        </div>

        {bundels.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", width: 440, marginLeft: "auto", alignSelf: "center" }}>
            {bundels.slice(0, 3).map((b, i) => {
              const icon = bundelIcon(b.avatar, null, b.title)
              const colors = tonePalette(bundelTone(b.slug, icon))
              return (
                <div key={b.slug} style={{ display: "flex", alignItems: "center", backgroundImage: colors.field, borderRadius: 32, padding: "22px 26px", marginTop: i ? 18 : 0, color: "white", boxShadow: "0 18px 40px rgba(20,22,30,0.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 20, background: colors.chip, fontSize: 38, flexShrink: 0 }}>
                    {icon.kind === "emoji" ? icon.value : b.title.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}>
                    <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>{clip(b.title, 20)}</div>
                    <div style={{ display: "flex", fontSize: 22, opacity: 0.85 }}>{b._count.links} {b._count.links === 1 ? "link" : "links"}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ position: "absolute", bottom: 44, left: 72, display: "flex", alignItems: "center", fontSize: 26, fontWeight: 700, color: base }}>
          <div style={{ display: "flex", marginRight: 12 }}>
            <MarkImage height={34} base={base} top={top} />
          </div>
          bundel.link/{user?.username ?? ""}
        </div>
      </div>
    ),
    { width: 1200, height: 630, emoji: "fluent", fonts: await ogFonts() }
  )
}
