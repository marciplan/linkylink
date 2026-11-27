import { prisma } from "@/lib/prisma"

// Serves an uploaded profile photo. The URL carries ?v=<upload time>; only the
// current version is served, so an old or removed photo stops showing.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const v = new URL(request.url).searchParams.get("v")
  const user = await prisma.user.findUnique({ where: { id }, select: { photo: true, photoType: true, image: true } })
  if (!user?.photo || !user.photoType) return new Response("Not found", { status: 404 })
  const current = user.image ? new URL(user.image, "http://x").searchParams.get("v") : null
  if (!v || v !== current) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } })
  return new Response(new Uint8Array(user.photo), {
    headers: {
      "Content-Type": user.photoType,
      // A day, not forever: a removed photo should not linger in caches.
      // Private: a shared cache would keep serving a photo after it is removed.
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
