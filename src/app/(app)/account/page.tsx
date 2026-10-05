import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/PageHeader"
import { AccountView } from "./AccountView"

export const metadata = { title: "You - Bundel" }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/account")

  const [user, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, name: true, email: true, image: true },
    }),
    prisma.linkLink.aggregate({
      where: { userId: session.user.id },
      _count: true,
      _sum: { views: true },
    }),
  ])
  if (!user) redirect("/login")

  return (
    <>
      <PageHeader title="You" />
      <AccountView
        user={user}
        bundelCount={stats._count}
        totalViews={stats._sum.views ?? 0}
      />
    </>
  )
}
