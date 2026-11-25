import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 })

  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim()
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Use a JPEG, PNG or WebP image." }, { status: 415 })

  const bytes = new Uint8Array(await request.arrayBuffer())
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return NextResponse.json({ error: "That image is too big." }, { status: 413 })
  if (!looksLike(type, bytes)) return NextResponse.json({ error: "That doesn't look like an image." }, { status: 415 })

  const image = `/api/photo/${session.user.id}?v=${Date.now()}`
  await prisma.user.update({ where: { id: session.user.id }, data: { photo: bytes, photoType: type, image } })
  return NextResponse.json({ image })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  await prisma.user.update({ where: { id: session.user.id }, data: { photo: null, photoType: null, image: null } })
  return NextResponse.json({ ok: true })
}
