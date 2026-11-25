"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { normalizeDomain } from "@/lib/blocked-sites"

// Owner-side settings for AI connections: connected apps and sites to skip.

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function revokeAiApp(grantId: string) {
  const userId = await requireUser()
  await prisma.mcpGrant.updateMany({ where: { id: grantId, userId, revokedAt: null }, data: { revokedAt: new Date() } })
  revalidatePath("/account")
}

export async function addBlockedSite(input: string) {
  const userId = await requireUser()
  const domain = normalizeDomain(input)
  if (!domain) throw new Error("That doesn't look like a website")
  const count = await prisma.blockedSite.count({ where: { userId } })
  if (count >= 200) throw new Error("That's the maximum number of sites to skip")
  const site = await prisma.blockedSite.upsert({
    where: { userId_domain: { userId, domain } },
    create: { userId, domain },
    update: {},
    select: { id: true, domain: true },
  })
  revalidatePath("/account")
  return site
}

export async function removeBlockedSite(id: string) {
  const userId = await requireUser()
  await prisma.blockedSite.deleteMany({ where: { id, userId } })
  revalidatePath("/account")
}

