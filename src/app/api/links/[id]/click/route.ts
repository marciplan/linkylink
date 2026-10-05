import { prisma } from "@/lib/prisma"

// Receives <a ping> beacons from link rows, so clicks are counted without any
// client JavaScript and the link itself stays a plain, copyable URL.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.link
    .update({ where: { id }, data: { clicks: { increment: 1 } } })
    .catch(() => null)
  return new Response(null, { status: 204 })
}
