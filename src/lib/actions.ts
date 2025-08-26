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

  revalidatePath("/dashboard")
  return linkylink
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
    throw new Error("LinkyLink not found")
  }

  // Fetch favicon using API with fallback handling
  let favicon = null
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/favicon?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const data = await response.json()
      favicon = data.favicon
    }
  } catch {
    // Ignore favicon errors - favicon will remain null
  }

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
    throw new Error("LinkyLink not found")
  }

  // Fetch favicon using API with fallback handling
  let favicon = null
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/favicon?url=${encodeURIComponent(linkData.url)}`)
    if (response.ok) {
      const data = await response.json()
      favicon = data.favicon
    }
  } catch {
    // Ignore favicon errors - favicon will remain null
  }

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
    throw new Error("LinkyLink not found")
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
    throw new Error("LinkyLink not found")
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
    throw new Error("LinkyLink not found")
  }

  await prisma.linkLink.delete({
    where: { id: linkylinkId },
  })

  revalidatePath("/dashboard")
  return { success: true }
}