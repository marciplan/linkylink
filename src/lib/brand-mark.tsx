// The Bundel mark: a "b" made of two interlocking shapes. Only the glyph is
// kept (the original tile background is dropped) and it is always drawn in two
// tones: a strong base and a softer top. See BundelMark for the in-app version.

export const MARK_VIEWBOX = "204.5 93 120.5 148.2"
export const MARK_RATIO = 120.5 / 148.2

/** The lower bowl and stem: the strong tone. */
export const MARK_BASE =
  "m304.9 160.8c-7.148 6.477-17.91 13.28-26.08 15.2 11.41 0.7586 20.74 9.599 20.74 21.12 0 12.14-10.59 20.86-20.98 20.86h-32.12c-10.33 0-18.38-7.994-18.38-15.35v-27.28c0-10.71 8.811-18.56 18.47-18.56h8.87c5.048 0 10.12-1.955 14.21-4.727 7.469-5.223 13.8-9.191 15.87-12.84h-39.68c-23.08 0-41.05 20.54-41.05 41.69v21.88c0 23.93 20.51 38.05 38.72 38.05h39.94c20.63 0 41.23-17.91 41.23-43.74 0.1751-15.49-8.315-29.12-19.75-36.33z"

/** The upper loop: the soft tone. */
export const MARK_TOP =
  "m279.1 93.37h-66.17c-3.297 0-5.427 2.363-5.427 5.544v60.57c4.989-9.191 14-16.81 22.64-20.28v-28.07h45.02c9.862 0 16.81 8.024 16.81 17.83 0 7.119-3.735 13.39-9.424 17.62-4.318 3.297-8.432 6.361-12.34 8.811-4.318 2.684-9.628 4.668-14.85 4.668h-8.636c-8.257 0-14.88 6.331-15.43 14.12h36.82c9.307 0 17.83-3.56 24.57-8.286 13.74-8.753 22.23-20.69 22.23-36.68 0-20.28-16.4-35.86-35.8-35.86z"

/** Brand greys for places without CSS (image renderers, static files). */
export const MARK_COLORS = {
  light: { base: "#16171d", top: "#5f6270" },
  dark: { base: "#f5f6f8", top: "#aeb1bb" },
}

/** The mark with explicit colours, for next/og images. `height` in px. */
export function MarkImage({ height, base, top }: { height: number; base: string; top: string }) {
  return (
    <svg width={Math.round(height * MARK_RATIO)} height={height} viewBox={MARK_VIEWBOX}>
      <path d={MARK_BASE} fill={base} />
      <path d={MARK_TOP} fill={top} />
    </svg>
  )
}

/** The mark as a standalone SVG file that follows the system theme (favicons). */
export function markSvgFile() {
  const { light, dark } = MARK_COLORS
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}"><style>.a{fill:${light.base}}.b{fill:${light.top}}@media (prefers-color-scheme:dark){.a{fill:${dark.base}}.b{fill:${dark.top}}}</style><path class="a" d="${MARK_BASE}"/><path class="b" d="${MARK_TOP}"/></svg>`
}
