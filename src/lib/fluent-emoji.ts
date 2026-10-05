// Microsoft Fluent Emoji (3D style, MIT licensed), served as 256px WebP files
// named by codepoint. Rendering Bundel icons from one set makes them look the
// same on every phone instead of depending on the visitor's system emoji font.

const CDN =
  process.env.NEXT_PUBLIC_EMOJI_CDN ?? "https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets"

const VS16 = "fe0f"

function codepoints(emoji: string): string[] {
  return Array.from(emoji).map((c) => c.codePointAt(0)!.toString(16))
}

/**
 * Candidate file URLs, most likely first. Files use fully-qualified sequences,
 * which is what keyboards produce; AI suggestions sometimes drop or add the
 * variation selector, so the alternatives cover both.
 */
export function fluentEmojiUrls(emoji: string): string[] {
  const cps = codepoints(emoji)
  const stripped = cps.filter((c) => c !== VS16)
  const qualified = [stripped[0], VS16, ...stripped.slice(1)]
  const names = [cps.join("-"), stripped.join("-"), qualified.join("-")]
  return Array.from(new Set(names)).map((name) => `${CDN}/${name}.webp`)
}
