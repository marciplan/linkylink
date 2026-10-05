import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateEmojiSuggestions } from "@/lib/emoji-generator"
import { generateBackgroundOptions } from "@/lib/background-generator"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const { linkylinkId, title, subtitle } = await request.json()

    if (!linkylinkId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the linkylink exists
    const linkylink = await prisma.linkLink.findUnique({
      where: { id: linkylinkId },
    })

    if (!linkylink) {
      return NextResponse.json(
        { error: "Linkylink not found" },
        { status: 404 }
      )
    }

    console.log('🚀 Background generation started for linkylink:', linkylinkId)

    // Generate emoji suggestions
    const emojiSuggestions = await generateEmojiSuggestions(title, subtitle)
    const defaultEmoji = emojiSuggestions[0] || '😊'
    console.log('Generated default emoji:', defaultEmoji)

    // Generate background options
    const backgroundData = await generateBackgroundOptions(title, subtitle, defaultEmoji)
    console.log('Generated background images:', backgroundData.images.length)

    // Fill in the icon unless the owner picked one meanwhile. Backgrounds are
    // stored as options only; by default the page uses its themed gradient.
    await prisma.linkLink.update({
      where: { id: linkylinkId },
      data: {
        headerPrompt: backgroundData.prompt,
        headerImages: backgroundData.images,
      },
    })
    await prisma.linkLink.updateMany({
      where: { id: linkylinkId, avatar: null },
      data: { avatar: defaultEmoji },
    })

    console.log('✅ Background generation completed for linkylink:', linkylinkId)

    // Revalidate the dashboard to show updated data
    revalidatePath("/dashboard")
    revalidatePath(`/[username]/[slug]`, 'page')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Background generation failed:', error)
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    )
  }
}