import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { linkId } = await request.json()

    if (!linkId) {
      return NextResponse.json({ error: "Missing linkId" }, { status: 400 })
    }

    // Verify the link belongs to the user
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: {
        linkylink: {
          select: { userId: true }
        }
      }
    })

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    if (link.linkylink.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create a dismissed recommendation record
    await prisma.dismissedRecommendation.create({
      data: {
        userId: session.user.id,
        linkId: linkId
      }
    })

    return NextResponse.json({
      success: true,
      message: "Recommendation dismissed"
    })
  } catch (error) {
    console.error("Error in recommendations/dismiss:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}