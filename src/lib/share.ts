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
