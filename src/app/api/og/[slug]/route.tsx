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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2%, transparent 0%)`,
              backgroundSize: "50px 50px",
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
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "white",
                marginBottom: "20px",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {linkylink.title}
            </h1>
            
            {/* Subtitle */}
            {linkylink.subtitle && (
              <p
                style={{
                  fontSize: "32px",
                  color: "rgba(255,255,255,0.9)",
                  marginBottom: "40px",
                  textAlign: "center",
                }}
              >
                {linkylink.subtitle}
              </p>
            )}
            
            {/* Links preview */}
            {linkylink.links.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  width: "100%",
                  marginTop: "20px",
                }}
              >
                {linkylink.links.map((link, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "16px",
                      padding: "20px 30px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.3)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "24px",
                        color: "white",
                        flex: 1,
                      }}
                    >
                      {link.title}
                    </span>
                  </div>
                ))}
                
                {linkylink.links.length < linkylink._count?.links && (
                  <div
                    style={{
                      fontSize: "20px",
                      color: "rgba(255,255,255,0.7)",
                      textAlign: "center",
                    }}
                  >
                    +{linkylink._count.links - 3} more links
                  </div>
                )}
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
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.3)",
                }}
              />
              <span
                style={{
                  fontSize: "24px",
                  color: "rgba(255,255,255,0.9)",
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
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.2)",
              }}
            />
            <span
              style={{
                fontSize: "20px",
                color: "rgba(255,255,255,0.7)",
                fontWeight: "600",
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
  } catch {
    return new Response("Failed to generate image", { status: 500 })
  }
}
