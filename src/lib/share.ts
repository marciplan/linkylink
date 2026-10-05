import { toast } from "sonner"

/** Native share sheet where available, clipboard + toast everywhere else. */
export async function shareOrCopy(data: { title: string; text?: string; url: string }) {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share(data)
      return
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return
    }
  }
  await copyText(data.url)
}

export async function copyText(text: string, message = "Link copied") {
  try {
    await navigator.clipboard.writeText(text)
    toast(message)
  } catch {
    toast.error("Couldn't copy — long-press to copy instead")
  }
}

/**
 * Share a generated image (a Story) through the native share sheet. Where files
 * can't be shared, open the image so it can be long-pressed and saved.
 */
export async function shareImage({ imageUrl, filename, title, text }: { imageUrl: string; filename: string; title: string; text?: string }) {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error("image failed")
    const blob = await res.blob()
    const file = new File([blob], filename, { type: blob.type || "image/png" })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text })
      return
    }
    window.open(URL.createObjectURL(blob), "_blank")
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return
    toast.error("Couldn't prepare the image. Try again?")
  }
}
