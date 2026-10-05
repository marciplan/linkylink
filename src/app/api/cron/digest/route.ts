import { prisma } from "@/lib/prisma"
import { appUrl, emailEnabled, escapeHtml, sendEmail } from "@/lib/email"
import { domainOf } from "@/lib/links"

// Daily (see vercel.json): email confirmed followers the links added since
// their last email. Nothing new means no email.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 })
  }
  if (!emailEnabled()) return Response.json({ skipped: "email not configured" })

  const follows = await prisma.emailFollow.findMany({
    where: { confirmedAt: { not: null } },
    include: { followee: { select: { id: true, username: true, name: true } } },
  })

  let sent = 0
  for (const follow of follows) {
    const since = follow.lastSentAt ?? follow.confirmedAt!
    const links = await prisma.link.findMany({
      where: { createdAt: { gt: since }, linkylink: { userId: follow.followeeId, isPublic: true, type: "NORMAL" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { linkylink: { select: { title: true, slug: true } } },
    })
    if (links.length === 0) continue

    const who = follow.followee.name || `@${follow.followee.username}`
    const unsubscribe = appUrl(`/follow/unsubscribe?token=${follow.token}`)
    const items = links.map((l) => ({
      title: l.title,
      url: l.url,
      note: l.context,
      bundel: l.linkylink.title,
      bundelUrl: appUrl(`/${follow.followee.username}/${l.linkylink.slug}`),
    }))

    const ok = await sendEmail({
      to: follow.email,
      subject: `${links.length} new ${links.length === 1 ? "link" : "links"} from ${who}`,
      unsubscribeUrl: appUrl(`/api/follow/unsubscribe?token=${follow.token}`),
      text:
        items.map((i) => `${i.title} (${domainOf(i.url)})\n${i.url}${i.note ? `\n“${i.note}”` : ""}\nIn ${i.bundel}: ${i.bundelUrl}`).join("\n\n") +
        `\n\nUnsubscribe: ${unsubscribe}`,
      html:
        `<p>New from <strong>${escapeHtml(who)}</strong>:</p>` +
        items
          .map(
            (i) =>
              `<p><a href="${i.url}"><strong>${escapeHtml(i.title)}</strong></a> <span style="color:#888">${escapeHtml(domainOf(i.url))}</span>` +
              (i.note ? `<br><em>“${escapeHtml(i.note)}”</em>` : "") +
              `<br><a href="${i.bundelUrl}" style="color:#666">In ${escapeHtml(i.bundel)}</a></p>`
          )
          .join("") +
        `<p style="color:#888;font-size:12px"><a href="${unsubscribe}">Unsubscribe</a></p>`,
    })
    if (ok) {
      sent++
      await prisma.emailFollow.update({ where: { id: follow.id }, data: { lastSentAt: new Date() } })
    }
  }
  return Response.json({ follows: follows.length, sent })
}
