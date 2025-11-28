import { ImageResponse } from "@vercel/og"
import type { NextRequest } from 'next/server'
import { prisma } from "@/lib/prisma"

// Prisma is not supported in Edge runtime; use Node.js runtime here
export const runtime = "nodejs"

const DEFAULT_GRADIENT = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
const TIMEOUT_MS = 4000 // 4 seconds to stay under social platform limits

// Generic fallback image for timeouts/errors
function createFallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: DEFAULT_GRADIENT,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.15)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "120px",
              marginBottom: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            📦
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "white",
              marginBottom: "20px",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            Bundel
          </div>
          <div
            style={{
              fontSize: "36px",
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 2px 15px rgba(0,0,0,0.4)",
            }}
          >
            All your links, one place
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  )
}

// Timeout helper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ])
}

// Extract gradient colors from SVG data URI (simplified approach)
function extractGradientFromSVG(svgDataUri: string | null): string {
  if (!svgDataUri) {
    return DEFAULT_GRADIENT
  }

  try {
    // Decode base64 SVG
    const base64Data = svgDataUri.split(',')[1]
    if (!base64Data) return DEFAULT_GRADIENT

    const svgContent = Buffer.from(base64Data, 'base64').toString('utf-8')

    // Extract colors from stop-color attributes
    const colorMatches = svgContent.match(/stop-color="([^"]+)"/g)
    if (!colorMatches || colorMatches.length < 2) {
      return DEFAULT_GRADIENT
    }

    const colors = colorMatches
      .map(match => match.match(/stop-color="([^"]+)"/)?.[1])
      .filter(Boolean)
      .slice(0, 3) // Take first 3 colors

    if (colors.length < 2) {
      return DEFAULT_GRADIENT
    }

    // Create CSS gradient
    if (colors.length === 2) {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
    } else {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`
    }
  } catch (error) {
    console.error('Failed to extract gradient from SVG:', error)
    return DEFAULT_GRADIENT
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Fetch with timeout to stay under social platform limits
    const linkylink = await withTimeout(
      prisma.linkLink.findUnique({
        where: { slug },
        select: {
          title: true,
          subtitle: true,
          avatar: true,
          headerImage: true,
          user: {
            select: { username: true }
          },
          _count: {
            select: { links: true }
          }
        },
      }),
      TIMEOUT_MS
    )

    if (!linkylink) {
      // Return fallback for not found (still shows branded image)
      return createFallbackImage()
    }

    // Extract CSS gradient from SVG headerImage
    const background = extractGradientFromSVG(linkylink.headerImage)

    // Get emoji (avatar field)
    const emoji = linkylink.avatar || '🔗'

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background,
            position: "relative",
          }}
        >
          {/* Semi-transparent overlay for better text readability */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.15)",
            }}
          />

          {/* Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px",
              maxWidth: "1000px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Emoji Avatar */}
            <div
              style={{
                fontSize: "120px",
                marginBottom: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: "white",
                border: "8px solid white",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {emoji}
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "white",
                marginBottom: "20px",
                textAlign: "center",
                lineHeight: 1.2,
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              {linkylink.title}
            </div>

            {/* Subtitle */}
            {linkylink.subtitle && (
              <div
                style={{
                  fontSize: "32px",
                  color: "rgba(255,255,255,0.95)",
                  marginBottom: "40px",
                  textAlign: "center",
                  textShadow: "0 2px 15px rgba(0,0,0,0.4)",
                }}
              >
                {linkylink.subtitle}
              </div>
            )}

            {/* Link count badge */}
            {linkylink._count?.links > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.25)",
                  borderRadius: "100px",
                  padding: "12px 24px",
                  fontSize: "24px",
                  color: "white",
                  fontWeight: "600",
                }}
              >
                {linkylink._count.links} {linkylink._count.links === 1 ? 'link' : 'links'}
              </div>
            )}

            {/* User info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "40px",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                @{linkylink.user.username}
              </span>
            </div>
          </div>

          {/* Logo */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "40px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontSize: "24px",
                color: "rgba(255,255,255,0.8)",
                fontWeight: "600",
                textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              }}
            >
              Bundel
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    // Return fallback image instead of error for better UX on social platforms
    return createFallbackImage()
  }
}
