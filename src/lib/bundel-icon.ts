const FALLBACK_EMOJIS = ["🎯", "🚀", "💡", "🌟", "📚", "🎨", "🎵", "💻", "🌈", "🔥"]

function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function isEmojiAvatar(src: string): boolean {
  return (src.length <= 4 && /\p{Emoji}/u.test(src)) || (!src.includes("http") && !src.includes("/") && !src.includes("."))
}

export type BundelIcon = { kind: "emoji"; value: string } | { kind: "image"; value: string }

/** Resolve a Bundel's icon: its own avatar, else the owner's photo, else a stable emoji. */
export function bundelIcon(avatar: string | null | undefined, userImage: string | null | undefined, title: string): BundelIcon {
  const src = avatar || userImage
  if (src) {
    if (isEmojiAvatar(src)) {
      return { kind: "emoji", value: src.match(/\p{Extended_Pictographic}(‍\p{Extended_Pictographic}|️)*/u)?.[0] || src }
    }
    return { kind: "image", value: src }
  }
  return { kind: "emoji", value: FALLBACK_EMOJIS[hashString(title) % FALLBACK_EMOJIS.length] }
}
