import { ImageResponse } from "next/og"
import { MARK_COLORS, MarkImage } from "@/lib/brand-mark"
import { ogFonts } from "../fonts"

/** Share image for every page without its own: the mark, the name, the promise. */
export async function GET() {
  const { base, top } = MARK_COLORS.light
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter",
          background: "radial-gradient(circle at 50% 38%, #ffffff 0%, #f1f2f5 70%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <MarkImage height={170} base={base} top={top} />
          <div style={{ display: "flex", marginTop: 36, fontSize: 92, fontWeight: 800, letterSpacing: "-0.04em", color: base }}>Bundel</div>
          <div style={{ display: "flex", marginTop: 6, fontSize: 38, color: top }}>All your links, one page.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts() }
  )
}
