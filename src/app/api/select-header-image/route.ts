import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { linkylinkId, imageUrl } = await request.json()

    if (!linkylinkId || !imageUrl) {
      return NextResponse.json({ error: 'Missing linkylinkId or imageUrl' }, { status: 400 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure ownership
    const linkylink = await prisma.linkLink.findFirst({
      where: { id: linkylinkId, userId: session.user.id },
      select: { id: true, headerImages: true }
    })

    if (!linkylink) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Optionally, ensure the selected URL is part of headerImages; if not, append
    const images = Array.isArray(linkylink.headerImages) ? linkylink.headerImages : []
    const nextImages = images.includes(imageUrl) ? images : [imageUrl, ...images].slice(0, 10)

    await prisma.linkLink.update({
      where: { id: linkylinkId },
      data: {
        headerImage: imageUrl,
        headerImages: nextImages,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('select-header-image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

