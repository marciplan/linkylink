import { ImageResponse } from "next/og"

/** The Bundel app mark: a link glyph on the ink background, full-bleed for maskable icons. */
export function appIcon(size: number) {
  const glyph = Math.round(size * 0.5)
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #2a2d3a 0%, #111218 100%)",
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
          <line x1="8" x2="16" y1="12" y2="12" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
