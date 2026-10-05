import { readFile } from "fs/promises"
import { join } from "path"

// Inter (SIL OFL 1.1, from @fontsource/inter) for share images; the renderer's
// built-in font has no bold weights.
let cache: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 600 | 800; style: "normal" }[]> | null = null

export function ogFonts() {
  cache ??= Promise.all(
    ([400, 600, 800] as const).map(async (weight) => {
      const buf = await readFile(join(process.cwd(), "src/app/api/og/fonts", `inter-${weight}.woff`))
      return { name: "Inter", data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, weight, style: "normal" as const }
    })
  ).catch((error) => {
    console.error("OG fonts unavailable, using the default font", error)
    return []
  })
  return cache
}
