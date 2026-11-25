import { prisma } from "@/lib/prisma"
import { optional } from "@/lib/optional"

/**
 * Ids of the user's sub-Bundels (made by AI activities). They are reached
 * through the link they hang under, so Bundel lists leave them out. Empty
 * until `prisma db push` has created the table.
 */
export async function subBundelIds(userId: string): Promise<string[]> {
  return optional(
    prisma.subBundel.findMany({ where: { child: { userId } }, select: { childId: true } }).then((rows) => rows.map((r) => r.childId)),
    []
  )
}

/** Where a sub-Bundel hangs, or null when it is a normal Bundel (or the table is missing). */
export async function subBundelParent(bundelId: string) {
  return optional(
    prisma.subBundel.findUnique({
      where: { childId: bundelId },
      select: { activity: true, sourceLinkId: true, parent: { select: { title: true, slug: true, user: { select: { username: true } } } } },
    }),
    null
  )
}

/** Private sub-Bundels are the owner's alone, unlike private Bundels, which stay reachable by link. */
export async function isHiddenFrom(bundel: { id: string; isPublic: boolean; userId: string }, viewerId: string | null | undefined) {
  if (bundel.isPublic || bundel.userId === viewerId) return false
  return (await subBundelParent(bundel.id)) !== null
}
