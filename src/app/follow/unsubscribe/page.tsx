import { prisma } from "@/lib/prisma"
import { FollowResult } from "../FollowResult"

export const metadata = { title: "Unsubscribed - Bundel", robots: { index: false } }

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (token) await prisma.emailFollow.deleteMany({ where: { token } })
  return <FollowResult title="Unsubscribed" body="You won't get any more emails about these Bundels." href="/" cta="Go to Bundel" />
}
