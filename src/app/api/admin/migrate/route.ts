import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function fetchFavicon(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    // Use configured host or default to the local dev port 3000 for internal API calls
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/favicon?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      return data.favicon || null
    }
    return null
  } catch (error) {
    console.log(`Favicon fetch failed for ${url}:`, error)
    return null
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Simple admin check - you can make this more sophisticated
    // For now, checking if user email contains "admin" or is a specific email
    const isAdmin = session.user.email.includes('admin') || 
                   session.user.email === 'your-email@domain.com' // Replace with your email
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    const { type } = await request.json()
    
    if (type === 'favicons') {
      const result = await migrateFavicons()
      return NextResponse.json(result)
    } else if (type === 'backgrounds') {
      const result = await regenerateBackgrounds()
      return NextResponse.json(result)
    } else if (type === 'all') {
      const faviconResult = await migrateFavicons()
      const backgroundResult = await regenerateBackgrounds()
      
      return NextResponse.json({
        success: true,
        message: "Both migrations completed",
        favicons: faviconResult,
        backgrounds: backgroundResult
      })
    } else {
      return NextResponse.json({ error: "Invalid migration type" }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}

async function migrateFavicons() {
  // Find all links without favicons
  const linksWithoutFavicons = await prisma.link.findMany({
    where: {
      OR: [
        { favicon: null },
        { favicon: "" }
      ]
    },
    select: {
      id: true,
      url: true,
      title: true,
    }
  })
  
  let updated = 0
  let failed = 0
  
  for (const link of linksWithoutFavicons) {
    try {
      const favicon = await fetchFavicon(link.url)
      
      if (favicon) {
        await prisma.link.update({
          where: { id: link.id },
          data: { favicon }
        })
        updated++
      } else {
        failed++
      }
      
      // Rate limiting: wait 200ms between requests
      await sleep(200)
      
    } catch (error) {
      failed++
      console.error(`Error processing ${link.title}:`, error)
    }
  }
  
  return {
    type: 'favicons',
    processed: linksWithoutFavicons.length,
    updated,
    failed
  }
}

async function regenerateBackgrounds() {
  // Find linkylinks without background images
  const linkylinkWithoutBackgrounds = await prisma.linkLink.findMany({
    where: {
      OR: [
        { headerImage: null },
        { headerImage: "" }
      ]
    },
    select: {
      id: true,
      title: true,
      subtitle: true,
      avatar: true,
    }
  })
  
  let updated = 0
  let failed = 0
  
  for (const linkylink of linkylinkWithoutBackgrounds) {
    try {
      // Import the generator functions
      const { generateEmojiSuggestions } = await import('@/lib/emoji-generator')
      const { generateBackgroundOptions } = await import('@/lib/background-generator')
      
      // Generate emoji if none exists
      let emoji = linkylink.avatar
      if (!emoji) {
        const emojiSuggestions = await generateEmojiSuggestions(linkylink.title, linkylink.subtitle)
        emoji = emojiSuggestions[0] || ''
      }
      
      // Generate background
      const backgroundData = await generateBackgroundOptions(linkylink.title, linkylink.subtitle, emoji)
      
      const updateData: {
        avatar?: string;
        headerImage?: string;
        headerPrompt?: string;
        headerImages?: string[];
      } = {}
      
      if (!linkylink.avatar && emoji) {
        updateData.avatar = emoji
      }
      
      if (backgroundData.selectedImage) {
        updateData.headerImage = backgroundData.selectedImage
      }
      
      if (backgroundData.prompt) {
        updateData.headerPrompt = backgroundData.prompt
      }
      
      if (backgroundData.images.length > 0) {
        updateData.headerImages = backgroundData.images
      }
      
      // Update if we have something to update
      if (Object.keys(updateData).length > 0) {
        await prisma.linkLink.update({
          where: { id: linkylink.id },
          data: updateData
        })
        updated++
      } else {
        failed++
      }
      
      // Rate limiting: wait 1 second between background generations
      await sleep(1000)
      
    } catch (error) {
      failed++
      console.error(`Error processing ${linkylink.title}:`, error)
    }
  }
  
  return {
    type: 'backgrounds', 
    processed: linkylinkWithoutBackgrounds.length,
    updated,
    failed
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Migration API endpoint",
    usage: "POST with { type: 'favicons' | 'backgrounds' | 'all' }"
  })
}
