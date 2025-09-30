import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { linkId, targetBundleId, action } = await request.json()

    if (!linkId || !targetBundleId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (action !== "move" && action !== "copy") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get the link with its current bundle
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: {
        linkylink: {
          select: { userId: true, id: true }
        }
      }
    })

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    // Verify the link belongs to the user
    if (link.linkylink.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Verify the target bundle belongs to the user
    const targetBundle = await prisma.linkLink.findUnique({
      where: { id: targetBundleId },
      include: {
        links: {
          orderBy: { order: 'desc' },
          take: 1
        }
      }
    })

    if (!targetBundle) {
      return NextResponse.json({ error: "Target bundle not found" }, { status: 404 })
    }

    if (targetBundle.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the next order number for the target bundle
    const nextOrder = targetBundle.links.length > 0 ? targetBundle.links[0].order + 1 : 0

    if (action === "copy") {
      // Create a copy in the target bundle
      await prisma.link.create({
        data: {
          linkylinkId: targetBundleId,
          title: link.title,
          url: link.url,
          favicon: link.favicon,
          context: link.context,
          order: nextOrder,
          clicks: 0
        }
      })

      return NextResponse.json({
        success: true,
        message: "Link copied successfully"
      })
    } else {
      // Move the link to the target bundle
      await prisma.link.update({
        where: { id: linkId },
        data: {
          linkylinkId: targetBundleId,
          order: nextOrder
        }
      })

      return NextResponse.json({
        success: true,
        message: "Link moved successfully"
      })
    }
  } catch (error) {
    console.error("Error in recommendations/move:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}