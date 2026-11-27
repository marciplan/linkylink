"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar } from "@/components/Avatar"
import { isUploadedPhoto } from "@/lib/bundel-icon"

const SIZE = 256

/** Centre-crops the picked image to a square and shrinks it to 256px. WebP where the browser can, else JPEG. */
async function squareThumb(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext("2d")!
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  const encode = (type: string, quality: number) => new Promise<Blob | null>((done) => canvas.toBlob(done, type, quality))
  const webp = await encode("image/webp", 0.86)
  // Browsers that can't write WebP silently hand back a PNG instead.
  if (webp?.type === "image/webp") return webp
  const jpeg = await encode("image/jpeg", 0.88)
  if (!jpeg) throw new Error("encode failed")
  return jpeg
}

/** Your photo on the account page: tap it to pick a new one. */
export function ProfilePhoto({ username, image }: { username: string; image: string | null }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const hasPhoto = !!image && isUploadedPhoto(image)

  async function upload(file: File) {
    setBusy(true)
    try {
      const blob = await squareThumb(file)
      const res = await fetch("/api/account/photo", { method: "POST", headers: { "Content-Type": blob.type }, body: blob })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Upload failed")
      toast.success("Photo updated")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error && error.message !== "encode failed" ? error.message : "Couldn't use that image. Try another one.")
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      const res = await fetch("/api/account/photo", { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Photo removed")
      router.refresh()
    } catch {
      toast.error("Couldn't remove your photo. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={hasPhoto ? "Change your photo" : "Add a photo"}
        className="pressable relative rounded-full"
      >
        <Avatar src={image} username={username} size={56} />
        <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-bg ring-2 ring-surface">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </span>
      </button>
      {hasPhoto && (
        <button type="button" onClick={remove} disabled={busy} className="text-[12px] font-medium text-ink-3 hover:text-ink">
          Remove
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) upload(file)
        }}
      />
    </div>
  )
}
