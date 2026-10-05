"use server"

import { randomBytes } from "crypto"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { addLink } from "@/lib/actions"
import { appUrl, emailEnabled, escapeHtml, sendEmail } from "@/lib/email"
import { notify, summarizeVotes } from "@/lib/sharing"

async function clientIp() {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local"
}

async function limit(bucket: string, max: number, windowMs: number) {
  const { allowed } = checkRateLimit(`${bucket}:${await clientIp()}`, max, windowMs)
  if (!allowed) throw new Error("Too many requests. Try again in a minute.")
}

/** Signed-in visitors vote as themselves; everyone else uses their device key and chosen name. */
async function resolveVoter(voterKey: string, voterName: string) {
  const session = await auth()
  if (session?.user?.id) {
    return { key: `u:${session.user.id}`, name: session.user.username || voterName, userId: session.user.id }
  }
  return { key: `d:${voterKey}`, name: voterName, userId: null as string | null }
}

async function requireOwner(linkylinkId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const bundel = await prisma.linkLink.findUnique({
    where: { id: linkylinkId, userId: session.user.id },
    include: { user: { select: { username: true } } },
  })
  if (!bundel) throw new Error("Bundel not found")
  return bundel
}

// ---------------------------------------------------------------- Ask mode --

const askSchema = z.object({
  enabled: z.boolean(),
  kind: z.enum(["PICK_ONE", "PICK_ANY"]).optional(),
  question: z.string().trim().max(120).nullable().optional(),
  allowSuggestions: z.boolean().optional(),
  closed: z.boolean().optional(),
})

export async function updateAsk(linkylinkId: string, data: z.infer<typeof askSchema>) {
  const bundel = await requireOwner(linkylinkId)
  const { enabled, ...settings } = askSchema.parse(data)
  if (!enabled) {
    await prisma.ask.deleteMany({ where: { linkylinkId } })
  } else {
    await prisma.ask.upsert({
      where: { linkylinkId },
      create: { linkylinkId, ...settings, question: settings.question || null },
      update: { ...settings, ...(settings.question !== undefined && { question: settings.question || null }) },
    })
  }
  revalidatePath(`/${bundel.user.username}/${bundel.slug}`)
  return prisma.ask.findUnique({ where: { linkylinkId } })
}

const voteSchema = z.object({
  linkylinkId: z.string(),
  linkId: z.string(),
  voterKey: z.string().min(8).max(64),
  voterName: z.string().trim().min(1).max(40),
})

/** Toggle a vote. In pick-one mode a new vote replaces the voter's previous one. */
export async function castVote(data: z.infer<typeof voteSchema>) {
  const input = voteSchema.parse(data)
  await limit("vote", 30, 60_000)

  const ask = await prisma.ask.findUnique({
    where: { linkylinkId: input.linkylinkId },
    include: { linkylink: { select: { title: true, slug: true, userId: true, user: { select: { username: true } } } } },
  })
  if (!ask || ask.closed) throw new Error("Voting is closed")
  const link = await prisma.link.findFirst({ where: { id: input.linkId, linkylinkId: input.linkylinkId }, select: { id: true, title: true } })
  if (!link) throw new Error("Link not found")

  const voter = await resolveVoter(input.voterKey, input.voterName)
  const existing = await prisma.vote.findUnique({ where: { linkId_voterKey: { linkId: link.id, voterKey: voter.key } } })

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } })
  } else {
    if (ask.kind === "PICK_ONE") {
      await prisma.vote.deleteMany({ where: { linkylinkId: input.linkylinkId, voterKey: voter.key } })
    }
    await prisma.vote.create({
      data: { linkylinkId: input.linkylinkId, linkId: link.id, voterKey: voter.key, voterName: voter.name },
    })
    if (voter.userId !== ask.linkylink.userId) {
      await notify(ask.linkylink.userId, "VOTE", voter.name, { ...ask.linkylink, username: ask.linkylink.user.username }, link.title)
    }
  }

  return { summary: await summarizeVotes(input.linkylinkId), mine: await myVotes(input.linkylinkId, input.voterKey) }
}

/** The links this visitor has voted for (keys never leave the server). */
export async function myVotes(linkylinkId: string, voterKey: string) {
  const session = await auth()
  const key = session?.user?.id ? `u:${session.user.id}` : `d:${voterKey}`
  const votes = await prisma.vote.findMany({ where: { linkylinkId, voterKey: key }, select: { linkId: true } })
  return votes.map((v) => v.linkId)
}

// -------------------------------------------------------------- Suggestions --

const suggestSchema = z.object({
  linkylinkId: z.string(),
  url: z.string().url().max(2000),
  title: z.string().trim().min(1).max(100),
  note: z.string().trim().max(280).optional(),
  voterKey: z.string().min(8).max(64),
  name: z.string().trim().min(1).max(40),
})

export async function suggestLink(data: z.infer<typeof suggestSchema>) {
  const input = suggestSchema.parse(data)
  if (!/^https?:\/\//i.test(input.url)) throw new Error("Invalid link")
  await limit("suggest", 5, 60_000)

  const ask = await prisma.ask.findUnique({
    where: { linkylinkId: input.linkylinkId },
    include: { linkylink: { select: { title: true, slug: true, userId: true, user: { select: { username: true } } } } },
  })
  if (!ask || ask.closed || !ask.allowSuggestions) throw new Error("This Bundel isn't taking suggestions")

  const voter = await resolveVoter(input.voterKey, input.name)
  const pending = await prisma.suggestion.count({ where: { linkylinkId: input.linkylinkId, voterKey: voter.key } })
  if (pending >= 5) throw new Error("You already have 5 suggestions waiting")

  await prisma.suggestion.create({
    data: {
      linkylinkId: input.linkylinkId,
      url: input.url,
      title: input.title,
      note: input.note || null,
      name: voter.name,
      voterKey: voter.key,
    },
  })
  await notify(ask.linkylink.userId, "SUGGESTION", voter.name, { ...ask.linkylink, username: ask.linkylink.user.username }, input.title)
  revalidatePath(`/${ask.linkylink.user.username}/${ask.linkylink.slug}`)
}

export async function acceptSuggestion(id: string) {
  const suggestion = await prisma.suggestion.findUnique({ where: { id } })
  if (!suggestion) throw new Error("Suggestion not found")
  await requireOwner(suggestion.linkylinkId)
  const context = suggestion.note ? `${suggestion.note} (suggested by ${suggestion.name})` : `Suggested by ${suggestion.name}`
  const link = await addLink({
    linkylinkId: suggestion.linkylinkId,
    title: suggestion.title,
    url: suggestion.url,
    context: context.slice(0, 280),
  })
  await prisma.suggestion.delete({ where: { id } })
  return link
}

export async function declineSuggestion(id: string) {
  const suggestion = await prisma.suggestion.findUnique({ where: { id } })
  if (!suggestion) return
  await requireOwner(suggestion.linkylinkId)
  await prisma.suggestion.delete({ where: { id } })
}

// ----------------------------------------------------------------- Activity --

export async function markActivityRead() {
  const session = await auth()
  if (!session?.user?.id) return
  await prisma.activity.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } })
}

// ------------------------------------------------------------- Email follow --

const followSchema = z.object({ username: z.string(), email: z.string().trim().toLowerCase().email().max(200) })

/** Double opt-in: store a pending follow and email a confirmation link. */
export async function followByEmail(data: z.infer<typeof followSchema>) {
  if (!emailEnabled()) throw new Error("Email updates aren't available")
  const { username, email } = followSchema.parse(data)
  await limit("follow", 5, 10 * 60_000)

  const followee = await prisma.user.findUnique({ where: { username }, select: { id: true, name: true, username: true } })
  if (!followee) throw new Error("Not found")

  const existing = await prisma.emailFollow.findUnique({ where: { email_followeeId: { email, followeeId: followee.id } } })
  if (existing?.confirmedAt) return { status: "already" as const }

  const token = existing?.token ?? randomBytes(24).toString("base64url")
  if (!existing) await prisma.emailFollow.create({ data: { email, followeeId: followee.id, token } })

  const who = followee.name || `@${followee.username}`
  const confirm = appUrl(`/follow/confirm?token=${token}`)
  const sent = await sendEmail({
    to: email,
    subject: `Confirm updates from ${who} on Bundel`,
    text: `Tap to get an email when ${who} adds new links on Bundel:\n${confirm}\n\nIf you didn't ask for this, ignore this email and nothing will happen.`,
    html: `<p>Tap to get an email when <strong>${escapeHtml(who)}</strong> adds new links on Bundel.</p><p><a href="${confirm}">Yes, send me updates</a></p><p style="color:#666">If you didn't ask for this, ignore this email and nothing will happen.</p>`,
  })
  if (!sent) throw new Error("Couldn't send the confirmation email. Try again later.")
  return { status: "sent" as const }
}
