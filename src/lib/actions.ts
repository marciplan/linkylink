"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createLinkylinkSchema = z.object({
  title: z.string().min(1).max(100),
  subtitle: z.string().max(200).optional(),
  avatar: z.string().url().optional(),
})

const addLinkSchema = z.object({
  linkylinkId: z.string(),
  title: z.string().min(1).max(100),
  url: z.string().url(),
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
      avatar,
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

  const { linkylinkId, title, url } = addLinkSchema.parse(data)

  // Verify ownership
  const linkylink = await prisma.linkLink.findUnique({
    where: { id: linkylinkId, userId: session.user.id },
    include: { links: true },
  })

  if (!linkylink) {
    throw new Error("LinkyLink not found")
  }

  // Fetch favicon
  let favicon = null
  try {
    const domain = new URL(url).hostname
    favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    // Ignore favicon errors
  }

  const link = await prisma.link.create({
    data: {
      title,
      url,
      favicon,
      order: linkylink.links.length,
      linkylinkId,
    },
  })

  revalidatePath(`/dashboard`)
  revalidatePath(`/edit/${linkylinkId}`)
  return link
}

export async function addLinkToLinkylink(linkylinkId: string, linkData: { title: string; url: string; order?: number }) {
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

  // Fetch favicon
  let favicon = null
  try {
    const domain = new URL(linkData.url).hostname
    favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    // Ignore favicon errors
  }

  const link = await prisma.link.create({
    data: {
      title: linkData.title,
      url: linkData.url,
      favicon,
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

export async function updateLinkylink(linkylinkId: string, data: { title?: string, subtitle?: string }) {
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