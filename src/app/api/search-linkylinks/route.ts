import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const linkylinks = await prisma.linkLink.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { subtitle: { contains: query, mode: 'insensitive' } },
          { 
            links: {
              some: {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { url: { contains: query, mode: 'insensitive' } },
                  { context: { contains: query, mode: 'insensitive' } }
                ]
              }
            }
          }
        ]
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        slug: true,
        avatar: true,
        headerImage: true,
        user: {
          select: {
            username: true
          }
        },
        _count: {
          select: { links: true }
        }
      },
      take: 10
    })

    const results = linkylinks.map(linkylink => ({
      id: linkylink.id,
      title: linkylink.title,
      subtitle: linkylink.subtitle,
      slug: linkylink.slug,
      avatar: linkylink.avatar || null,
      headerImage: linkylink.headerImage || null,
      username: linkylink.user.username,
      linkCount: linkylink._count.links
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
