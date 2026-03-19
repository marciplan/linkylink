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

  // Trigger background generation (non-blocking)
  // The API route will handle emoji and background generation asynchronously
  if (!avatar) {
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-defaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkylinkId: linkylink.id,
        title,
        subtitle
      }),
    }).catch(err => {
      console.error('Failed to trigger background generation:', err)
    })
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

export async function updateLink(linkId: string, data: { title: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership through linkylink
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { linkylink: { include: { user: true } } },
  })

  if (!link || link.linkylink.userId !== session.user.id) {
    throw new Error("Link not found")
  }

  const updated = await prisma.link.update({
    where: { id: linkId },
    data: { title: data.title.trim() },
  })

  revalidatePath(`/dashboard`)
  revalidatePath(`/edit/${link.linkylinkId}`)
  revalidatePath(`/${link.linkylink.user.username}/${link.linkylink.slug}`)
  return updated
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

export async function incrementLikes(linkId: string) {
  const link = await prisma.link.update({
    where: { id: linkId },
    data: { likes: { increment: 1 } },
  })
  return link.likes
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

// Year Review Actions

const createYearReviewSchema = z.object({
  title: z.string().min(1).max(100),
  subtitle: z.string().max(200).optional(),
  year: z.number().int().min(2000).max(2100),
  avatar: z.string().url().optional().or(z.literal("")),
})

export async function createYearReview(data: z.infer<typeof createYearReviewSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const { title, subtitle, year, avatar } = createYearReviewSchema.parse(data)

  // Generate unique slug
  const slug = generateSlug(title)
  let counter = 0
  let uniqueSlug = slug

  while (await prisma.linkLink.findUnique({ where: { slug: uniqueSlug } })) {
    counter++
    uniqueSlug = `${slug}-${counter}`
  }

  const linkylink = await prisma.linkLink.create({
    data: {
      title,
      subtitle,
      avatar: avatar || undefined,
      slug: uniqueSlug,
      userId: session.user.id,
      type: "YEAR_REVIEW",
      year,
    },
    include: {
      user: true
    }
  })

  // Trigger background generation for avatar if not provided
  if (!avatar) {
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-defaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkylinkId: linkylink.id,
        title,
        subtitle
      }),
    }).catch(err => {
      console.error('Failed to trigger background generation:', err)
    })
  }

  revalidatePath("/dashboard")
  return linkylink
}

// Valid icons for categories (matches CategoryIconPicker)
const VALID_CATEGORY_ICONS = [
  "Star", "Heart", "Award", "Trophy", "Medal", "Crown", "Gem", "Sparkles",
  "Globe", "Monitor", "Laptop", "Smartphone", "Tablet", "Cpu", "Code", "Terminal",
  "Film", "Music", "Headphones", "Camera", "Video", "Mic", "Radio", "Tv",
  "Coffee", "Pizza", "Utensils", "Wine", "Beer", "Cake", "Cookie", "IceCream",
  "Plane", "Car", "Train", "Ship", "MapPin", "Mountain", "Palmtree", "Tent",
  "ShoppingBag", "ShoppingCart", "Store", "CreditCard", "Wallet", "DollarSign", "Briefcase", "Building",
  "Dumbbell", "Activity", "Apple", "Salad", "Pill", "Stethoscope",
  "Gamepad", "Dice1", "Puzzle", "Joystick", "Clapperboard", "Popcorn", "Drama",
  "Book", "BookOpen", "GraduationCap", "Library", "Notebook", "PenTool", "Lightbulb",
  "Users", "User", "Baby", "Dog", "Cat", "Bird", "MessageCircle", "Share2",
  "Sun", "Moon", "Cloud", "Snowflake", "Leaf", "Flower", "TreeDeciduous",
  "Wrench", "Hammer", "Scissors", "Paintbrush", "Palette", "Brush",
  "Bike", "Target", "Flag", "Timer",
  "Gift", "Package", "Box", "Archive", "Folder", "Clock", "Calendar", "Zap",
  "ThumbsUp", "ThumbsDown"
] as const

const addCategorySchema = z.object({
  linkylinkId: z.string(),
  name: z.string().min(1).max(100),
  icon: z.enum(VALID_CATEGORY_ICONS).default("Star"),
  categoryType: z.enum(["BEST", "WORST"]),
  rankLimit: z.number().int().min(1).max(10),
})

export async function addCategory(data: z.infer<typeof addCategorySchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const { linkylinkId, name, icon, categoryType, rankLimit } = addCategorySchema.parse(data)

  // Verify ownership and type
  const linkylink = await prisma.linkLink.findUnique({
    where: { id: linkylinkId, userId: session.user.id },
    include: { categories: true, user: true },
  })

  if (!linkylink) {
    throw new Error("Bundel not found")
  }

  if (linkylink.type !== "YEAR_REVIEW") {
    throw new Error("Categories can only be added to Year Review bundels")
  }

  // Check for duplicate category name
  const existingCategory = linkylink.categories.find(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  )
  if (existingCategory) {
    throw new Error(`A category named "${name}" already exists`)
  }

  const category = await prisma.category.create({
    data: {
      name,
      icon,
      categoryType,
      rankLimit,
      order: linkylink.categories.length,
      linkylinkId,
    },
  })

  revalidatePath(`/dashboard`)
  revalidatePath(`/${linkylink.user.username}/${linkylink.slug}`)
  return category
}

export async function updateCategory(categoryId: string, data: { name?: string; icon?: string; categoryType?: "BEST" | "WORST"; rankLimit?: number }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership through linkylink
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { linkylink: { include: { user: true } } },
  })

  if (!category || category.linkylink.userId !== session.user.id) {
    throw new Error("Category not found")
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.icon && { icon: data.icon }),
      ...(data.categoryType && { categoryType: data.categoryType }),
      ...(data.rankLimit && { rankLimit: data.rankLimit }),
    },
  })

  revalidatePath(`/dashboard`)
  revalidatePath(`/${category.linkylink.user.username}/${category.linkylink.slug}`)
  return updated
}

export async function deleteCategory(categoryId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { linkylink: { include: { user: true } } },
  })

  if (!category || category.linkylink.userId !== session.user.id) {
    throw new Error("Category not found")
  }

  await prisma.category.delete({
    where: { id: categoryId },
  })

  // Reorder remaining categories
  const remainingCategories = await prisma.category.findMany({
    where: { linkylinkId: category.linkylinkId },
    orderBy: { order: "asc" },
  })

  await Promise.all(
    remainingCategories.map((c, index) =>
      prisma.category.update({
        where: { id: c.id },
        data: { order: index },
      })
    )
  )

  revalidatePath(`/dashboard`)
  revalidatePath(`/${category.linkylink.user.username}/${category.linkylink.slug}`)
}

export async function updateCategoryOrder(linkylinkId: string, categoryIds: string[]) {
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

  // Update each category's order
  await Promise.all(
    categoryIds.map((categoryId, index) =>
      prisma.category.update({
        where: { id: categoryId },
        data: { order: index },
      })
    )
  )

  revalidatePath(`/dashboard`)
  revalidatePath(`/${linkylink.user.username}/${linkylink.slug}`)
}

const addCategoryItemSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1).max(100),
  url: z.string().url(),
  context: z.string().max(280).optional(),
})

export async function addCategoryItem(data: z.infer<typeof addCategoryItemSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const { categoryId, title, url, context } = addCategoryItemSchema.parse(data)

  // Verify ownership through category -> linkylink
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      linkylink: { include: { user: true } },
      items: true
    },
  })

  if (!category || category.linkylink.userId !== session.user.id) {
    throw new Error("Category not found")
  }

  // Check rank limit
  if (category.items.length >= category.rankLimit) {
    throw new Error(`This category is limited to ${category.rankLimit} items`)
  }

  // Check for duplicate URL in this category
  const existingItem = category.items.find(item => item.url === url)
  if (existingItem) {
    throw new Error(`This URL already exists in this category (Rank #${existingItem.rank})`)
  }

  // Create item immediately without waiting for favicon (non-blocking)
  const item = await prisma.categoryItem.create({
    data: {
      title,
      url,
      favicon: null, // Will be fetched in background
      context,
      rank: category.items.length + 1,
      categoryId,
    },
  })

  // Fetch favicon in background (non-blocking)
  const itemId = item.id
  setImmediate(async () => {
    try {
      let favicon = await fetchFavicon(url)
      let retryCount = 0
      const maxRetries = 3

      // Retry if initial fetch failed
      while (!favicon && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        favicon = await fetchFavicon(url)
        retryCount++
      }

      if (favicon) {
        await prisma.categoryItem.update({
          where: { id: itemId },
          data: { favicon }
        })
      }
    } catch (error) {
      console.error(`Failed to fetch favicon for ${url}:`, error)
    }
  })

  revalidatePath(`/dashboard`)
  revalidatePath(`/${category.linkylink.user.username}/${category.linkylink.slug}`)
  return item
}

export async function updateItemRank(categoryId: string, itemIds: string[]) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { linkylink: { include: { user: true } } },
  })

  if (!category || category.linkylink.userId !== session.user.id) {
    throw new Error("Category not found")
  }

  // Update each item's rank (1-indexed)
  await Promise.all(
    itemIds.map((itemId, index) =>
      prisma.categoryItem.update({
        where: { id: itemId },
        data: { rank: index + 1 },
      })
    )
  )

  revalidatePath(`/dashboard`)
  revalidatePath(`/${category.linkylink.user.username}/${category.linkylink.slug}`)
}

export async function deleteCategoryItem(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const item = await prisma.categoryItem.findUnique({
    where: { id: itemId },
    include: { category: { include: { linkylink: { include: { user: true } } } } },
  })

  if (!item || item.category.linkylink.userId !== session.user.id) {
    throw new Error("Item not found")
  }

  await prisma.categoryItem.delete({
    where: { id: itemId },
  })

  // Reorder remaining items
  const remainingItems = await prisma.categoryItem.findMany({
    where: { categoryId: item.categoryId },
    orderBy: { rank: "asc" },
  })

  await Promise.all(
    remainingItems.map((i, index) =>
      prisma.categoryItem.update({
        where: { id: i.id },
        data: { rank: index + 1 },
      })
    )
  )

  revalidatePath(`/dashboard`)
  revalidatePath(`/${item.category.linkylink.user.username}/${item.category.linkylink.slug}`)
}

export async function incrementCategoryItemClicks(itemId: string) {
  await prisma.categoryItem.update({
    where: { id: itemId },
    data: { clicks: { increment: 1 } },
  })
}

export async function incrementCategoryItemLikes(itemId: string) {
  const item = await prisma.categoryItem.update({
    where: { id: itemId },
    data: { likes: { increment: 1 } },
  })
  return item.likes
}

// Comment Actions

const addCommentSchema = z.object({
  linkId: z.string(),
  content: z.string().min(1).max(500),
})

export async function addComment(data: z.infer<typeof addCommentSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const { linkId, content } = addCommentSchema.parse(data)

  // Verify the link exists and get path info for revalidation
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: {
      id: true,
      linkylink: { select: { slug: true, user: { select: { username: true } } } },
    },
  })

  if (!link) {
    throw new Error("Link not found")
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: session.user.id,
      linkId,
    },
    include: {
      user: {
        select: { username: true, image: true },
      },
    },
  })

  revalidatePath(`/${link.linkylink.user.username}/${link.linkylink.slug}`)
  return comment
}

export async function getComments(linkId: string) {
  const comments = await prisma.comment.findMany({
    where: { linkId },
    include: {
      user: {
        select: { username: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })
  return comments
}

export async function deleteComment(commentId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      userId: true,
      link: {
        select: {
          linkylink: { select: { userId: true, slug: true, user: { select: { username: true } } } },
        },
      },
    },
  })

  if (!comment) {
    throw new Error("Comment not found")
  }

  // Only comment author or bundel owner can delete
  const isCommentAuthor = comment.userId === session.user.id
  const isBundelOwner = comment.link.linkylink.userId === session.user.id

  if (!isCommentAuthor && !isBundelOwner) {
    throw new Error("Unauthorized")
  }

  await prisma.comment.delete({
    where: { id: commentId },
  })

  revalidatePath(`/${comment.link.linkylink.user.username}/${comment.link.linkylink.slug}`)
}

export async function updateCategoryItem(itemId: string, data: { title?: string; context?: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Verify ownership
  const item = await prisma.categoryItem.findUnique({
    where: { id: itemId },
    include: { category: { include: { linkylink: { include: { user: true } } } } },
  })

  if (!item || item.category.linkylink.userId !== session.user.id) {
    throw new Error("Item not found")
  }

  const updated = await prisma.categoryItem.update({
    where: { id: itemId },
    data: {
      ...(data.title && { title: data.title.trim() }),
      ...(data.context !== undefined && { context: data.context }),
    },
  })

  revalidatePath(`/dashboard`)
  revalidatePath(`/${item.category.linkylink.user.username}/${item.category.linkylink.slug}`)
  return updated
}
