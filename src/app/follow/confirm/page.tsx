import { prisma } from "@/lib/prisma"
import { recordActivity } from "@/lib/sharing"
import { FollowResult } from "../FollowResult"

export const metadata = { title: "Confirm updates - Bundel", robots: { index: false } }

export default async function ConfirmFollowPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const follow = token
    ? await prisma.emailFollow.findUnique({ where: { token }, include: { followee: { select: { id: true, username: true, name: true } } } })
    : null

  if (!follow) {
    return <FollowResult title="That link has expired" body="Ask for updates again from the curator's page." href="/" cta="Go to Bundel" />
  }

  if (!follow.confirmedAt) {
    await prisma.emailFollow.update({ where: { id: follow.id }, data: { confirmedAt: new Date() } })
    // The curator learns they have a new follower, never who (the email stays private).
    await recordActivity(follow.followee.id, "FOLLOW", "Someone", {
      title: "your Bundels",
      slug: "",
      username: follow.followee.username,
    })
  }

  const who = follow.followee.name || `@${follow.followee.username}`
  return (
    <FollowResult
      title="You're in"
      body={`You'll get an email when ${who} adds new links, at most once a day. Every email has an unsubscribe link.`}
      href={`/${follow.followee.username}`}
      cta={`See ${who}'s Bundels`}
    />
  )
}
