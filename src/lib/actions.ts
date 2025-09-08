"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createLinkylinkSchema = z.object({
  title: z.string().min(1).max(100),
  subtitle: z.string().max(200).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
})

const addLinkSchema = z.object({
  linkylinkId: z.string(),
  title: z.string().min(1).max(100),
  url: z.string().url(),
  context: z.string().max(280).optional(),
})

export async function createLinkylink(data: z.infer<typeof createLinkylinkSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const { title, subtitle, avatar } = createLinkylinkSchema.parse(data)
  
  // Generate unique slug
  const slug = generateSlug(title)
  let counter = 0
  let uniqueSlug = slug
  
  while (await prisma.linkLink.findUnique({ where: { slug: uniqueSlug } })) {
    counter++
    uniqueSlug = `${slug}-${counter}`
  }

  // Create the linkylink first
  const linkylink = await prisma.linkLink.create({
    data: {
      title,
      subtitle,
      avatar: avatar || undefined,
      slug: uniqueSlug,
      userId: session.user.id,
    },
    include: {
      user: true
    }
  })

  // Auto-generate default emoji and background immediately after creation
  try {
    // Import the generator functions
    const { generateEmojiSuggestions } = await import('@/lib/emoji-generator')
    const { generateBackgroundOptions } = await import('@/lib/background-generator')
    
    console.log('🚀 Starting auto-generation of defaults for linkylink:', linkylink.id)
    
    // Generate emoji suggestions
    const emojiSuggestions = await generateEmojiSuggestions(title, subtitle)
    const defaultEmoji = emojiSuggestions[0] || ''
    console.log('Generated default emoji:', defaultEmoji)
    
    // Generate background options using the emoji
    const backgroundData = await generateBackgroundOptions(title, subtitle, defaultEmoji)
    console.log('Generated default background and images:', { 
      selectedImage: backgroundData.selectedImage?.substring(0, 50) + '...', 
      imagesCount: backgroundData.images.length 
    })

    // Update linkylink with defaults, but only if user hasn't set an avatar
    const updateData: {
      avatar?: string;
      headerImage?: string;
      headerPrompt?: string;
      headerImages?: string[];
    } = {}
    
    if (!avatar && defaultEmoji) {
      updateData.avatar = defaultEmoji
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

    // Only update if we have something to update
    if (Object.keys(updateData).length > 0) {
      const updatedLinkylink = await prisma.linkLink.update({
        where: { id: linkylink.id },
        data: updateData,
        include: {
          user: true
        }
      })
      console.log('✅ Updated linkylink with defaults:', Object.keys(updateData))
      
      revalidatePath("/dashboard")
      return updatedLinkylink
    }
  } catch (error) {
    console.error('❌ Failed to auto-generate defaults:', error)
    // Continue with original linkylink if auto-generation fails
  }

  revalidatePath("/dashboard")
  return linkylink
}

async function fetchFavicon(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for initial fetch
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/favicon?url=${encodeURIComponent(url)}`, {
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
    console.log('Favicon fetch failed for', url, ':', error)
    return null
  }
}

export async function addLink(data: z.infer<typeof addLinkSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const { linkylinkId, title, url, context } = addLinkSchema.parse(data)

  // Verify ownership
  const linkylink = await prisma.linkLink.findUnique({
    where: { id: linkylinkId, userId: session.user.id },
    include: { links: true },
  })

  if (!linkylink) {
    throw new Error("Bundel not found")
  }

  // Fetch favicon BEFORE creating the link - users get instant visual feedback
  const favicon = await fetchFavicon(url)

  // Create the link with favicon (or null if fetch failed)
  const link = await prisma.link.create({
    data: {
      title,
      url,
      favicon,
      context,
      order: linkylink.links.length,
      linkylinkId,
    },
  })

  // If favicon fetch failed, retry in background with exponential backoff
  if (!favicon) {
    setImmediate(async () => {
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        
        const retryFavicon = await fetchFavicon(url)
        if (retryFavicon) {
          await prisma.link.update({
            where: { id: link.id },
            data: { favicon: retryFavicon }
          })
          break
        }
        
        retryCount++
      }
    })
  }

  revalidatePath(`/dashboard`)
  revalidatePath(`/edit/${linkylinkId}`)
  return link
}

export async function addLinkToLinkylink(linkylinkId: string, linkData: { title: string; url: string; context?: string; order?: number }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const linkylink = await prisma.linkLink.findUnique({
    where: { id: linkylinkId, userId: session.user.id },
    include: { links: true },
  })

  if (!linkylink) {
    throw new Error("Bundel not found")
  }

  // Fetch favicon BEFORE creating the link - users get instant visual feedback
  const favicon = await fetchFavicon(linkData.url)

  // Create the link with favicon (or null if fetch failed)
  const link = await prisma.link.create({
    data: {
      title: linkData.title,
      url: linkData.url,
      favicon,
      context: linkData.context,
      order: linkData.order ?? linkylink.links.length,
      linkylinkId,
    },
  })

  // If favicon fetch failed, retry in background with exponential backoff
  if (!favicon) {
    setImmediate(async () => {
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        
        const retryFavicon = await fetchFavicon(linkData.url)
        if (retryFavicon) {
          await prisma.link.update({
            where: { id: link.id },
            data: { favicon: retryFavicon }
          })
          break
        }
        
        retryCount++
      }
    })
  }

  revalidatePath(`/dashboard`)
  revalidatePath(`/edit/${linkylinkId}`)
  return link
}

export async function deleteLink(linkId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { linkylink: true },
  })

  if (!link || link.linkylink.userId !== session.user.id) {
    throw new Error("Link not found")
  }

  await prisma.link.delete({
    where: { id: linkId },
  })

  // Reorder remaining links
  const remainingLinks = await prisma.link.findMany({
    where: { linkylinkId: link.linkylinkId },
    orderBy: { order: "asc" },
  })

  await Promise.all(
    remainingLinks.map((l, index) =>
      prisma.link.update({
        where: { id: l.id },
        data: { order: index },
      })
    )
  )

  revalidatePath(`/dashboard`)
  revalidatePath(`/edit/${link.linkylinkId}`)
}

export async function updateLinkOrder(linkylinkId: string, linkIds: string[]) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const linkylink = await prisma.linkLink.findUnique({
    where: { id: linkylinkId, userId: session.user.id },
    include: { user: true }
  })

  if (!linkylink) {
    throw new Error("Bundel not found")
  }

  // Update each link's order
  await Promise.all(
    linkIds.map((linkId, index) =>
      prisma.link.update({
        where: { id: linkId },
        data: { order: index },
      })
    )
  )

  // Revalidate all relevant paths
  revalidatePath(`/dashboard`)
  revalidatePath(`/edit/${linkylinkId}`)
  revalidatePath(`/${linkylink.user.username}/${linkylink.slug}`)
}

export async function updateLinkylink(linkylinkId: string, data: { title?: string, subtitle?: string, avatar?: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const linkylink = await prisma.linkLink.findUnique({
    where: { id: linkylinkId, userId: session.user.id },
  })

  if (!linkylink) {
    throw new Error("Bundel not found")
  }

  const updated = await prisma.linkLink.update({
    where: { id: linkylinkId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    },
  })

  revalidatePath(`/dashboard`)
  revalidatePath(`/edit/${linkylinkId}`)
  return updated
}

export async function incrementViews(slug: string) {
  await prisma.linkLink.update({
    where: { slug },
    data: { views: { increment: 1 } },
  })
}

export async function incrementClicks(linkId: string) {
  await prisma.link.update({
    where: { id: linkId },
    data: { clicks: { increment: 1 } },
  })
}

export async function deleteLinkylink(linkylinkId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const linkylink = await prisma.linkLink.findUnique({
    where: { id: linkylinkId, userId: session.user.id },
  })

  if (!linkylink) {
    throw new Error("Bundel not found")
  }

  await prisma.linkLink.delete({
    where: { id: linkylinkId },
  })

  revalidatePath("/dashboard")
  return { success: true }
}
