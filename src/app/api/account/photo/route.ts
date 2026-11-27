import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isUploadedPhoto } from "@/lib/bundel-icon"

// Upload or remove your profile photo. The client crops and shrinks it to a
// 256px square first, so the body is small; anything big is refused.

const MAX_BYTES = 300_000
const TYPES = ["image/webp", "image/jpeg", "image/png"]

/** Checks the file's own first bytes, not just the header the client sent. */
function looksLike(type: string, b: Uint8Array) {
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  if (type === "image/png") return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  if (type === "image/webp") return String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP"
  return false
}

/**
 * Bundels without their own icon fall back to the owner's old `image` (an emoji or URL).
 * Copy that onto them before the photo replaces it, so their icon and colour stay put.
 */
async function keepBundelIcons(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } })
  const legacy = user?.image
  if (!legacy || isUploadedPhoto(legacy)) return
  await prisma.linkLink.updateMany({ where: { userId, OR: [{ avatar: null }, { avatar: "" }] }, data: { avatar: legacy } })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 })

  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim()
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Use a JPEG, PNG or WebP image." }, { status: 415 })

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return NextResponse.json({ error: "That image is too big." }, { status: 413 })
  }
  const bytes = new Uint8Array(await request.arrayBuffer())
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return NextResponse.json({ error: "That image is too big." }, { status: 413 })
  if (!looksLike(type, bytes)) return NextResponse.json({ error: "That doesn't look like an image." }, { status: 415 })

  const image = `/api/photo/${session.user.id}?v=${Date.now()}`
  await keepBundelIcons(session.user.id)
  await prisma.user.update({ where: { id: session.user.id }, data: { photo: bytes, photoType: type, image } })
  return NextResponse.json({ image })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  await keepBundelIcons(session.user.id)
  await prisma.user.update({ where: { id: session.user.id }, data: { photo: null, photoType: null, image: null } })
  return NextResponse.json({ ok: true })
}
