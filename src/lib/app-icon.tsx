import { ImageResponse } from "next/og"
import { MARK_COLORS, MarkImage } from "@/lib/brand-mark"

/**
 * The Bundel app icon: the two-tone mark on a pale tile, full-bleed so it also
 * works as a maskable icon (the mark stays inside the safe zone).
 */
export function appIcon(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
        <MarkImage height={Math.round(size * 0.52)} base={MARK_COLORS.light.base} top={MARK_COLORS.light.top} />
      </div>
    ),
    { width: size, height: size }
  )
}
