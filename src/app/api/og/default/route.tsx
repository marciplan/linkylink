import { ImageResponse } from "@vercel/og"

export const runtime = "edge" // Fast, no DB needed

export async function GET() {
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
        {/* Semi-transparent overlay for better contrast */}
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
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Emoji Brand Icon */}
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

          {/* Title */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "white",
              marginBottom: "20px",
              textAlign: "center",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            Bundel
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "36px",
              color: "rgba(255,255,255,0.95)",
              textAlign: "center",
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
    }
  )
}
