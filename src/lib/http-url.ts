/** True for an absolute http(s) URL. Links must be one of these, so a stored "javascript:" can never run. */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

/** A link's stored preview image as it may be shown: only real https URLs, never the lookup bookkeeping. */
export function shownLinkImage(image: string | null | undefined): string | null {
  return image?.startsWith("https://") ? image : null
}
