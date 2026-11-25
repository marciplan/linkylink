import { prisma } from "@/lib/prisma"

// Serves an uploaded profile photo. The URL carries ?v=<upload time>, so a new
// upload gets a new URL and this response can be cached for good.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { photo: true, photoType: true } })
  if (!user?.photo || !user.photoType) return new Response("Not found", { status: 404 })
  return new Response(new Uint8Array(user.photo), {
    headers: {
      "Content-Type": user.photoType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
