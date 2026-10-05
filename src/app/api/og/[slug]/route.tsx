import { ImageResponse } from "next/og"
import type { NextRequest } from 'next/server'
import { prisma } from "@/lib/prisma"
import { optional } from "@/lib/optional"
import { bundelHue, oklchToHex } from "@/lib/theme"
import { bundelIcon } from "@/lib/bundel-icon"
import { domainOf } from "@/lib/links"
import { ogFonts } from "../fonts"
import { categoryEmoji } from "@/lib/year-review"

export const runtime = "nodejs"

const TIMEOUT_MS = 4000
const WIDTH = 1200
const HEIGHT = 630
const BASE_OPTIONS = {
  width: WIDTH,
  height: HEIGHT,
  // Fluent emoji to match the app's icons (the renderer ships Fluent's Color style).
  emoji: 'fluent' as const,
  headers: {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  },
}

async function options() {
  return { ...BASE_OPTIONS, fonts: await ogFonts() }
}

const THEMES: { keywords: string[]; main: string; decor: string[] }[] = [
  { keywords: ['summer', 'beach', 'sun', 'vacation', 'tropic'], main: '☀️', decor: ['🌴', '🏖️', '🍉', '🕶️', '🌺', '🌊'] },
  { keywords: ['winter', 'snow', 'christmas', 'xmas', 'holiday'], main: '❄️', decor: ['⛄', '🎄', '🎁', '🧣', '☃️', '🦌'] },
  { keywords: ['food', 'cook', 'recipe', 'restaurant', 'dinner', 'meal'], main: '🍳', decor: ['🥘', '🍕', '🍔', '🥗', '🍝', '🌮'] },
  { keywords: ['music', 'song', 'playlist', 'album', 'concert', 'band'], main: '🎵', decor: ['🎶', '🎸', '🎹', '🎤', '🎧', '🥁'] },
  { keywords: ['book', 'read', 'lesson', 'learn', 'study', 'course', 'class'], main: '📚', decor: ['📖', '✏️', '📝', '🎓', '💡', '🧠'] },
  { keywords: ['knit', 'yarn', 'craft', 'sew', 'wool', 'crochet'], main: '🧶', decor: ['✂️', '🧵', '🪡', '🧥', '🌸', '💝'] },
  { keywords: ['travel', 'trip', 'flight', 'destination', 'journey', 'adventure'], main: '✈️', decor: ['🗺️', '🌍', '🏔️', '🎒', '📷', '🧭'] },
  { keywords: ['tech', 'code', 'dev', 'programming', 'software', 'startup'], main: '💻', decor: ['⌨️', '🖥️', '🔧', '⚡', '🚀', '🤖'] },
  { keywords: ['movie', 'film', 'show', 'tv', 'series', 'cinema'], main: '🎬', decor: ['🎥', '📺', '🍿', '🎞️', '🎭', '🏆'] },
  { keywords: ['fitness', 'gym', 'workout', 'exercise', 'sport', 'run'], main: '💪', decor: ['🏋️', '🏃', '🧘', '⚽', '🥊', '🏆'] },
  { keywords: ['art', 'design', 'paint', 'draw', 'creative'], main: '🎨', decor: ['🖌️', '🖼️', '✏️', '🖍️', '🌈', '✨'] },
  { keywords: ['game', 'gaming', 'play', 'console'], main: '🎮', decor: ['🕹️', '👾', '🎲', '🏆', '⭐', '⚔️'] },
  { keywords: ['news', 'article', 'blog', 'post', 'media'], main: '📰', decor: ['✍️', '📝', '🗞️', '💭', '☕', '🔖'] },
  { keywords: ['shop', 'shopping', 'buy', 'sale', 'deal', 'gift'], main: '🛍️', decor: ['🎁', '💳', '🛒', '💸', '✨', '💎'] },
  { keywords: ['year', 'review', 'best of', 'top'], main: '🏆', decor: ['⭐', '✨', '🎉', '🥇', '💫', '🎊'] },
  { keywords: ['love', 'heart', 'romance', 'dating', 'wedding'], main: '💖', decor: ['💝', '💕', '💘', '🌹', '✨', '💍'] },
  { keywords: ['coffee', 'cafe', 'tea', 'morning'], main: '☕', decor: ['🥐', '🍰', '🧁', '🍪', '✨', '📖'] },
  { keywords: ['pet', 'dog', 'cat', 'animal'], main: '🐶', decor: ['🐱', '🐾', '🦴', '🎾', '💕', '🌟'] },
  { keywords: ['business', 'finance', 'money', 'invest', 'crypto'], main: '💼', decor: ['💰', '📈', '🪙', '💎', '⚡', '🎯'] },
  { keywords: ['nature', 'garden', 'plant', 'flower', 'eco'], main: '🌿', decor: ['🌸', '🌻', '🌳', '🍃', '🌷', '🦋'] },
]




function detectTheme(text: string): typeof THEMES[number] | null {
  const lower = text.toLowerCase()
  for (const theme of THEMES) {
    if (theme.keywords.some(k => new RegExp(`\\b${k}\\b`).test(lower))) return theme
  }
  return null
}

/** The page's gradient in sRGB (the image renderer doesn't understand OKLCH). */
function palette(hue: number) {
  return {
    background: [
      `radial-gradient(circle at 0% 0%, ${oklchToHex(0.78, 0.12, (hue + 320) % 360)} 0%, transparent 60%)`,
      `radial-gradient(circle at 100% 10%, ${oklchToHex(0.62, 0.19, (hue + 40) % 360)} 0%, transparent 65%)`,
      `linear-gradient(160deg, ${oklchToHex(0.72, 0.16, hue)} 0%, ${oklchToHex(0.5, 0.16, hue)} 100%)`,
    ].join(", "),
    soft: oklchToHex(0.95, 0.03, hue),
    ink: oklchToHex(0.42, 0.15, hue),
  }
}

async function fallbackImage() {
  const { background } = palette(265)
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: background, fontFamily: 'Inter' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
          <div style={{ fontSize: 140, marginBottom: 20 }}>🔗</div>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: '-0.03em' }}>Bundel</div>
          <div style={{ fontSize: 34, opacity: 0.9, marginTop: 8 }}>All your links, one place</div>
        </div>
      </div>
    ),
    await options()
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms)
    timer.unref?.()
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text)

function Brand() {
  return (
    <div style={{ position: 'absolute', bottom: 40, left: 64, display: 'flex', alignItems: 'center', fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
      <span style={{ fontSize: 30, marginRight: 10 }}>🔗</span>
      bundel.link
    </div>
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const focusId = request.nextUrl.searchParams.get('l')

    const bundel = await withTimeout(
      prisma.linkLink.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          subtitle: true,
          avatar: true,
          user: { select: { username: true, image: true } },
          type: true,
          year: true,
          links: { orderBy: { order: 'asc' }, select: { id: true, title: true, url: true, context: true } },
          categories: {
            orderBy: { order: 'asc' },
            take: 3,
            select: { id: true, name: true, icon: true, items: { orderBy: { rank: 'asc' }, take: 1, select: { title: true } } },
          },
        },
      }),
      TIMEOUT_MS
    )
    if (!bundel) return fallbackImage()

    const ask = await withTimeout(optional(prisma.ask.findUnique({ where: { linkylinkId: bundel.id } }), null), TIMEOUT_MS).catch(() => null)
    const hue = bundelHue(slug)
    const colors = palette(hue)
    const icon = bundelIcon(bundel.avatar, null, bundel.title)
    const emoji = icon.kind === 'emoji' ? icon.value : (detectTheme(`${bundel.title} ${bundel.subtitle ?? ''}`)?.main ?? '🔗')
    const focus = focusId ? bundel.links.find((l) => l.id === focusId) : undefined

    // A Year Review previews as the year itself plus its first categories and their #1 picks.
    if (bundel.type === 'YEAR_REVIEW') {
      return new ImageResponse(
        (
          <div style={{ display: 'flex', width: '100%', height: '100%', backgroundImage: colors.background, position: 'relative', padding: '64px 64px 100px', fontFamily: 'Inter' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.38) 100%)', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', width: 600, color: 'white', position: 'relative', justifyContent: 'center' }}>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 600, letterSpacing: 6, opacity: 0.85 }}>THE YEAR IN REVIEW</div>
              <div style={{ display: 'flex', fontSize: 250, fontWeight: 800, letterSpacing: -14, lineHeight: 0.9, marginTop: 6 }}>{bundel.year ?? ''}</div>
              <div style={{ display: 'flex', fontSize: 42, fontWeight: 700, marginTop: 20 }}>{clip(bundel.title, 28)}</div>
              <div style={{ display: 'flex', fontSize: 28, opacity: 0.85, marginTop: 8 }}>@{bundel.user.username}</div>
            </div>
            {bundel.categories.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', width: 440, marginLeft: 'auto', position: 'relative', background: 'white', borderRadius: 36, padding: '16px 26px', alignSelf: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
                {bundel.categories.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '18px 0', borderTop: i ? '2px solid #eef0f4' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: colors.soft, fontSize: 36, flexShrink: 0 }}>{categoryEmoji(c.icon)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 18, width: 300 }}>
                      <div style={{ display: 'flex', fontSize: 22, fontWeight: 600, color: '#8a8e9c' }}>{clip(c.name, 22)}</div>
                      <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#15161c', marginTop: 2 }}>{c.items[0] ? clip(c.items[0].title, 20) : '…'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Brand />
          </div>
        ),
        await options()
      )
    }

    // One shared link: the link is the headline, the curator's note is the hook.
    if (focus) {
      return new ImageResponse(
        (
          <div style={{ display: 'flex', width: '100%', height: '100%', backgroundImage: colors.background, padding: 56, position: 'relative', fontFamily: 'Inter' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', background: 'white', borderRadius: 40, padding: '52px 60px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, color: '#6b6f80' }}>
                <span style={{ fontSize: 34, marginRight: 12 }}>{emoji}</span>
                {clip(`@${bundel.user.username} · ${bundel.title}`, 52)}
              </div>
              <div style={{ display: 'flex', fontSize: focus.title.length > 40 ? 60 : 72, fontWeight: 800, color: '#15161c', letterSpacing: '-0.03em', lineHeight: 1.05, marginTop: 28 }}>
                {clip(focus.title, 70)}
              </div>
              <div style={{ display: 'flex', fontSize: 30, color: colors.ink, fontWeight: 600, marginTop: 18 }}>{domainOf(focus.url)}</div>
              {focus.context && (
                <div style={{ display: 'flex', marginTop: 'auto', borderLeft: `6px solid ${colors.ink}`, paddingLeft: 24, fontSize: 34, color: '#3a3d4a', lineHeight: 1.3 }}>
                  “{clip(focus.context, 120)}”
                </div>
              )}
            </div>
          </div>
        ),
        await options()
      )
    }

    const top = bundel.links.slice(0, 3)
    const more = bundel.links.length - top.length
    const kicker = ask ? `@${bundel.user.username} asks` : `@${bundel.user.username}`
    const headline = ask?.question || bundel.title

    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', backgroundImage: colors.background, position: 'relative', padding: '64px 64px 100px', fontFamily: 'Inter' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.28) 100%)', display: 'flex' }} />

          {/* Left: who and what */}
          <div style={{ display: 'flex', flexDirection: 'column', width: top.length ? 560 : 1072, color: 'white', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, borderRadius: 36, background: 'rgba(255,255,255,0.28)', border: '2px solid rgba(255,255,255,0.5)', fontSize: 72 }}>
              {emoji}
            </div>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 600, opacity: 0.9, marginTop: 32 }}>{kicker}</div>
            <div style={{ display: 'flex', fontSize: headline.length > 32 ? 54 : 66, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.04, marginTop: 8, textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}>
              {clip(headline, 64)}
            </div>
            {ask ? (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 28, alignSelf: 'flex-start', background: 'white', color: colors.ink, borderRadius: 999, padding: '12px 26px', fontSize: 28, fontWeight: 700 }}>
                🗳️ Tap to vote
              </div>
            ) : (
              <div style={{ display: 'flex', fontSize: 28, opacity: 0.9, marginTop: 20 }}>
                {bundel.links.length} {bundel.links.length === 1 ? 'link' : 'links'}{bundel.subtitle ? ` · ${clip(bundel.subtitle, 40)}` : ''}
              </div>
            )}
          </div>

          {/* Right: what's inside */}
          {top.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', width: 480, marginLeft: 'auto', position: 'relative', background: 'white', borderRadius: 36, padding: '18px 26px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', alignSelf: 'center' }}>
              {top.map((link, i) => (
                <div key={link.id} style={{ display: 'flex', alignItems: 'center', padding: '18px 0', borderTop: i ? '2px solid #eef0f4' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 18, background: colors.soft, color: colors.ink, fontSize: 28, fontWeight: 800, flexShrink: 0 }}>
                    {domainOf(link.url).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 18, width: 340 }}>
                    <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#15161c' }}>{clip(link.title, 24)}</div>
                    <div style={{ display: 'flex', fontSize: 22, color: '#8a8e9c', marginTop: 2 }}>{clip(domainOf(link.url), 30)}</div>
                  </div>
                </div>
              ))}
              {more > 0 && (
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: colors.ink, padding: '12px 0 6px', borderTop: '2px solid #eef0f4' }}>
                  +{more} more
                </div>
              )}
            </div>
          )}

          <Brand />
        </div>
      ),
      await options()
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return fallbackImage()
  }
}
