import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Hide tidy-up suggestions for links.
 *   { linkId }     hides one
 *   { linkIds }    hides several at once (Ignore all)
 *   { restore }    shows them again (Undo)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Send a JSON object" }, { status: 400 })
    const isIdList = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 5000 && v.every((x) => typeof x === "string")

    if (body.restore !== undefined) {
      if (!isIdList(body.restore)) return NextResponse.json({ error: "Bad restore list" }, { status: 400 })
      await prisma.dismissedRecommendation.deleteMany({ where: { userId, linkId: { in: body.restore } } })
      return NextResponse.json({ success: true })
    }

    const linkIds: unknown = body.linkIds ?? (body.linkId ? [body.linkId] : null)
    if (!isIdList(linkIds) || linkIds.length === 0) {
      return NextResponse.json({ error: "Missing linkId" }, { status: 400 })
    }

    // Only the user's own links. Links deleted or moved since the page loaded are skipped, not fatal.
    const owned = await prisma.link.findMany({
      where: { id: { in: linkIds }, linkylink: { userId } },
      select: { id: true },
    })
    if (owned.length === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    await prisma.dismissedRecommendation.createMany({
      data: owned.map((l) => ({ userId, linkId: l.id })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, dismissed: owned.length })
  } catch (error) {
    console.error("Error in recommendations/dismiss:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
