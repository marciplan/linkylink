import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Placement = { linkId: string; bundleId: string }
type Restore = Placement & { order: number }

const MAX_BATCH = 200

const isPlacement = (m: unknown): m is Placement =>
  !!m && typeof (m as Placement).linkId === "string" && typeof (m as Placement).bundleId === "string"

/**
 * Moves many links at once (Tidy up → "Apply all") and can put them back.
 * - { moves: [{ linkId, bundleId }] } → moves each link to the end of that Bundel and
 *   returns where each one came from, so the client can offer Undo.
 * - { restore: [{ linkId, bundleId, order }] } → undoes a previous batch.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id
    const body = await request.json()

    const moves: unknown = body.moves
    const restore: unknown = body.restore
    const list = (Array.isArray(moves) ? moves : Array.isArray(restore) ? restore : null) as unknown[] | null
    if (!list || list.length === 0 || list.length > MAX_BATCH || !list.every(isPlacement)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const placements = list as Placement[]

    // Everything touched must belong to this person.
    const [links, bundles] = await Promise.all([
      prisma.link.findMany({
        where: { id: { in: placements.map((p) => p.linkId) }, linkylink: { userId } },
        select: { id: true, order: true, linkylinkId: true },
      }),
      prisma.linkLink.findMany({
        where: { id: { in: [...new Set(placements.map((p) => p.bundleId))] }, userId },
        select: { id: true, links: { orderBy: { order: "desc" }, take: 1, select: { order: true } } },
      }),
    ])
    const linkById = new Map(links.map((l) => [l.id, l]))
    const nextOrder = new Map(bundles.map((b) => [b.id, (b.links[0]?.order ?? -1) + 1]))
    if (links.length !== new Set(placements.map((p) => p.linkId)).size || nextOrder.size !== new Set(placements.map((p) => p.bundleId)).size) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (Array.isArray(moves)) {
      const updates = placements
        .filter((p) => linkById.get(p.linkId)!.linkylinkId !== p.bundleId)
        .map((p) => {
          const order = nextOrder.get(p.bundleId)!
          nextOrder.set(p.bundleId, order + 1)
          return prisma.link.update({ where: { id: p.linkId }, data: { linkylinkId: p.bundleId, order } })
        })
      await prisma.$transaction(updates)
      const undo: Restore[] = placements.map((p) => {
        const l = linkById.get(p.linkId)!
        return { linkId: l.id, bundleId: l.linkylinkId, order: l.order }
      })
      return NextResponse.json({ success: true, moved: updates.length, undo })
    }

    const restores = placements as Restore[]
    await prisma.$transaction(
      restores.map((r) =>
        prisma.link.update({ where: { id: r.linkId }, data: { linkylinkId: r.bundleId, order: Number.isFinite(r.order) ? r.order : 0 } })
      )
    )
    return NextResponse.json({ success: true, restored: restores.length })
  } catch (error) {
    console.error("Error in recommendations/apply:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
