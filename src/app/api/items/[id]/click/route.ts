import { prisma } from "@/lib/prisma"

// Counts a click on a Year Review pick (sent by <a ping>), like /api/links/[id]/click.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.categoryItem
    .update({ where: { id }, data: { clicks: { increment: 1 } } })
    .catch(() => null)
  return new Response(null, { status: 204 })
}
