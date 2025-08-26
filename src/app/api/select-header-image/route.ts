import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { linkylinkId, imageUrl } = await request.json()

    if (!linkylinkId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify LinkLink exists and user owns it
    const linkylink = await prisma.linkLink.findUnique({
      where: { id: linkylinkId, userId: session.user.id }
    })

    if (!linkylink) {
      return NextResponse.json({ error: 'LinkyLink not found or access denied' }, { status: 404 })
    }

    // Verify the imageUrl is in the stored headerImages array (security check)
    if (!linkylink.headerImages.includes(imageUrl)) {
      return NextResponse.json({ error: 'Invalid image selection' }, { status: 400 })
    }

    // Update the selected header image
    await prisma.linkLink.update({
      where: { id: linkylinkId },
      data: {
        headerImage: imageUrl,
      },
    })

    return NextResponse.json({ success: true, selectedImage: imageUrl })

  } catch (error) {
    console.error('Select header image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}