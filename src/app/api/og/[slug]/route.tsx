import { ImageResponse } from "@vercel/og"
import type { NextRequest } from 'next/server'
import { prisma } from "@/lib/prisma"

// Prisma is not supported in Edge runtime; use Node.js runtime here
export const runtime = "nodejs"

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

    // Extract background style from headerImage (SVG data URI)
    // If headerImage exists, extract the gradient/background from it
    let backgroundStyle = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" // fallback

    if (linkylink.headerImage) {
      // headerImage is a data URI like "data:image/svg+xml;base64,..."
      // We'll use it as a background image for proper rendering
      backgroundStyle = linkylink.headerImage
    }

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
            background: linkylink.headerImage
              ? `url(${linkylink.headerImage})`
              : backgroundStyle,
            backgroundSize: "cover",
            position: "relative",
          }}
        >
          {/* Semi-transparent overlay for better text readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.2)",
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
                textShadow: "0 4px 20px rgba(0,0,0,0.3)",
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
                  backdropFilter: "blur(10px)",
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
