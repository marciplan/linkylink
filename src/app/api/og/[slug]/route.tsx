import { ImageResponse } from "@vercel/og"
import type { NextRequest } from 'next/server'
import { prisma } from "@/lib/prisma"

// Prisma is not supported in Edge runtime; use Node.js runtime here
export const runtime = "nodejs"

// Extract gradient colors from SVG data URI (simplified approach)
function extractGradientFromSVG(svgDataUri: string | null): string {
  if (!svgDataUri) {
    return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  }

  try {
    // Decode base64 SVG
    const base64Data = svgDataUri.split(',')[1]
    if (!base64Data) return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"

    const svgContent = Buffer.from(base64Data, 'base64').toString('utf-8')

    // Extract colors from stop-color attributes
    const colorMatches = svgContent.match(/stop-color="([^"]+)"/g)
    if (!colorMatches || colorMatches.length < 2) {
      return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }

    const colors = colorMatches
      .map(match => match.match(/stop-color="([^"]+)"/)?.[1])
      .filter(Boolean)
      .slice(0, 3) // Take first 3 colors

    if (colors.length < 2) {
      return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }

    // Create CSS gradient
    if (colors.length === 2) {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
    } else {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`
    }
  } catch (error) {
    console.error('Failed to extract gradient from SVG:', error)
    return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const linkylink = await prisma.linkLink.findUnique({
      where: { slug },
      include: {
        user: true,
        links: {
          take: 3,
          orderBy: { order: "asc" },
        },
        _count: {
          select: { links: true }
        }
      },
    })

    if (!linkylink) {
      return new Response("Not found", { status: 404 })
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
              inset: 0,
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
            <h1
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
            </h1>

            {/* Subtitle */}
            {linkylink.subtitle && (
              <p
                style={{
                  fontSize: "32px",
                  color: "rgba(255,255,255,0.95)",
                  marginBottom: "40px",
                  textAlign: "center",
                  textShadow: "0 2px 15px rgba(0,0,0,0.4)",
                }}
              >
                {linkylink.subtitle}
              </p>
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
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return new Response("Failed to generate image", { status: 500 })
  }
}
