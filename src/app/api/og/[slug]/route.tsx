import { ImageResponse } from "next/og"
import type { NextRequest } from 'next/server'
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const TIMEOUT_MS = 4000

const GRADIENTS = [
  "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)",
  "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa8bff 0%, #2bd2ff 50%, #2bff88 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
  "linear-gradient(135deg, #ff5858 0%, #f09819 100%)",
  "linear-gradient(135deg, #5f72bd 0%, #9b23ea 100%)",
  "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
  "linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)",
]

const THEMES: { keywords: string[]; main: string; decor: string[] }[] = [
  { keywords: ['summer', 'beach', 'sun', 'vacation', 'tropic'], main: '☀️', decor: ['🌴', '🏖️', '🍉', '🕶️', '🌺', '🌊'] },
  { keywords: ['winter', 'snow', 'christmas', 'xmas', 'holiday'], main: '❄️', decor: ['⛄', '🎄', '🎁', '🧣', '☃️', '🦌'] },
  { keywords: ['food', 'cook', 'recipe', 'restaurant', 'dinner', 'meal'], main: '🍳', decor: ['🥘', '🍕', '🍔', '🥗', '🍝', '🌮'] },
  { keywords: ['music', 'song', 'playlist', 'album', 'concert', 'band'], main: '🎵', decor: ['🎶', '🎸', '🎹', '🎤', '🎧', '🥁'] },
  { keywords: ['book', 'read', 'lesson', 'learn', 'study', 'course', 'class'], main: '📚', decor: ['📖', '✏️', '📝', '🎓', '💡', '🧠'] },
  { keywords: ['knit', 'yarn', 'craft', 'sew', 'wool', 'crochet'], main: '🧶', decor: ['✂️', '🧵', '🪡', '🧥', '🌸', '💝'] },
  { keywords: ['travel', 'trip', 'flight', 'destination', 'journey', 'adventure'], main: '✈️', decor: ['🗺️', '🌍', '🏔️', '🎒', '📷', '🧭'] },
  { keywords: ['tech', 'code', 'dev', 'programming', 'software', 'startup'], main: '💻', decor: ['⌨️', '🖥️', '🔧', '⚡', '🚀', '🤖'] },
  { keywords: ['movie', 'film', 'show', ' tv ', 'series', 'cinema'], main: '🎬', decor: ['🎥', '📺', '🍿', '🎞️', '🎭', '🏆'] },
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

const GENERIC_DECOR = ['✨', '💫', '⭐', '🌟', '💎', '🔮', '🌈', '🎉', '💖', '🍀', '🎈', '🚀']

function hashSlug(slug: string): number {
  let hash = 2166136261
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length]
}

function detectTheme(text: string): typeof THEMES[number] | null {
  const lower = ` ${text.toLowerCase()} `
  for (const theme of THEMES) {
    if (theme.keywords.some(k => lower.includes(k))) return theme
  }
  return null
}

function buildScene(slug: string, title: string, subtitle: string | null, avatar: string | null) {
  const seed = hashSlug(slug)
  const theme = detectTheme(`${title} ${subtitle || ''}`)
  const background = pick(GRADIENTS, seed)
  const mainEmoji = avatar || theme?.main || pick(GENERIC_DECOR, seed, 3)
  const decorPool = theme?.decor || GENERIC_DECOR
  const decor = [
    { e: pick(decorPool, seed, 1), x: 60, y: 60, size: 80, rotate: -12 },
    { e: pick(decorPool, seed, 2), x: 1060, y: 80, size: 96, rotate: 14 },
    { e: pick(decorPool, seed, 4), x: 100, y: 480, size: 88, rotate: 10 },
    { e: pick(decorPool, seed, 6), x: 980, y: 460, size: 72, rotate: -8 },
    { e: pick(decorPool, seed, 8), x: 540, y: 30, size: 56, rotate: 0 },
    { e: pick(decorPool, seed, 10), x: 940, y: 280, size: 64, rotate: 18 },
  ]
  return { background, mainEmoji, decor }
}

function fallbackImage() {
  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pick(GRADIENTS, 0) }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: 140, marginBottom: 20 }}>📦</div>
          <div style={{ fontSize: 72, fontWeight: 'bold' }}>Bundel</div>
          <div style={{ fontSize: 32, opacity: 0.95, marginTop: 8 }}>All your links, one place</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ])
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const linkylink = await withTimeout(
      prisma.linkLink.findUnique({
        where: { slug },
        select: {
          title: true,
          subtitle: true,
          avatar: true,
          user: { select: { username: true } },
          _count: { select: { links: true } },
        },
      }),
      TIMEOUT_MS
    )

    if (!linkylink) return fallbackImage()

    const { background, mainEmoji, decor } = buildScene(
      slug,
      linkylink.title,
      linkylink.subtitle,
      linkylink.avatar
    )
    const linkCount = linkylink._count?.links ?? 0
    const subtitleLine =
      linkylink.subtitle ||
      `@${linkylink.user.username} · ${linkCount} ${linkCount === 1 ? 'link' : 'links'}`

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            position: 'relative',
            background,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 100%)',
              display: 'flex',
            }}
          />

          {decor.map((d, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: d.x,
                top: d.y,
                fontSize: d.size,
                transform: `rotate(${d.rotate}deg)`,
                opacity: 0.85,
                display: 'flex',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
              }}
            >
              {d.e}
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '0 100px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 190,
                height: 190,
                borderRadius: '50%',
                background: 'white',
                fontSize: 120,
                marginBottom: 36,
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              }}
            >
              {mainEmoji}
            </div>

            <div
              style={{
                fontSize: linkylink.title.length > 28 ? 64 : 80,
                fontWeight: 800,
                color: 'white',
                textAlign: 'center',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                textShadow: '0 4px 24px rgba(0,0,0,0.45)',
                maxWidth: 980,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {linkylink.title}
            </div>

            <div
              style={{
                fontSize: 30,
                color: 'rgba(255,255,255,0.95)',
                marginTop: 24,
                textAlign: 'center',
                textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                maxWidth: 900,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {subtitleLine}
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 26,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ fontSize: 32 }}>🔗</span>
            <span>Bundel</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return fallbackImage()
  }
}
