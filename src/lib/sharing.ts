import { prisma } from "@/lib/prisma"
import type { ActivityKind } from "@prisma/client"

// Server-only helpers for the sharing features. Not server actions, so they
// can't be called from the browser.

export type VoteSummary = Record<string, { count: number; names: string[] }>

/** Record something a person did for the Bundel's owner. Repeat votes collapse into one entry. */
export async function notify(
  userId: string,
  kind: ActivityKind,
  actorName: string,
  bundel: { title: string; slug: string; username: string },
  detail?: string
) {
  if (kind === "VOTE") {
    await prisma.activity.deleteMany({
      where: { userId, kind, actorName, bundelPath: `/${bundel.username}/${bundel.slug}`, read: false },
    })
  }
  await prisma.activity.create({
    data: {
      userId,
      kind,
      actorName: actorName.slice(0, 40),
      bundelTitle: bundel.title,
      bundelPath: `/${bundel.username}/${bundel.slug}`,
      detail: detail?.slice(0, 140),
    },
  })
}

export async function summarizeVotes(linkylinkId: string): Promise<VoteSummary> {
  const votes = await prisma.vote.findMany({
    where: { linkylinkId },
    orderBy: { createdAt: "asc" },
    select: { linkId: true, voterName: true },
  })
  const summary: VoteSummary = {}
  for (const v of votes) {
    const entry = (summary[v.linkId] ??= { count: 0, names: [] })
    entry.count++
    entry.names.push(v.voterName)
  }
  return summary
}

/** Used by Save a copy (in actions.ts) and comments. */
export async function recordActivity(
  ownerId: string,
  kind: ActivityKind,
  actorName: string,
  bundel: { title: string; slug: string; username: string },
  detail?: string
) {
  try {
    await notify(ownerId, kind, actorName, bundel, detail)
  } catch {
    // Activity is best-effort; never fail the action that triggered it.
  }
}

