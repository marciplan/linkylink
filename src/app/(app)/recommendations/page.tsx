import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { buttonStyles } from "@/components/ui/button"
import { RecommendationsClient } from "@/components/RecommendationsClient"

export default async function RecommendationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch all user's bundles with their links
  const bundles = await prisma.linkLink.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      links: {
        orderBy: { order: 'asc' }
      },
      user: {
        select: {
          username: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  })

  // Fetch dismissed recommendations
  const dismissedLinkIds = await prisma.dismissedRecommendation.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      linkId: true
    }
  })

  return (
    <>
      <PageHeader
        title="Tidy up"
        subtitle="Links that might fit better in another Bundel."
        leading={
          <Link href="/dashboard" aria-label="Back" className="pressable -ml-1 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ink/5">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        }
      />
      <main className="mx-auto max-w-2xl px-4">
        {bundles.length < 2 ? (
          <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-14 text-center shadow-card">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-tint-soft text-tint-ink">
              <Sparkles className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Make a second Bundel</h2>
            <p className="mt-1 text-[15px] text-ink-2">Suggestions appear once you have at least two.</p>
            <Link href="/create" className={buttonStyles({ className: "mt-6" })}>
              New Bundel
            </Link>
          </div>
        ) : (
          <RecommendationsClient
            bundles={bundles}
            dismissedLinkIds={dismissedLinkIds.map(d => d.linkId)}
          />
        )}
      </main>
    </>
  )
}
