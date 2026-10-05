import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findUrl } from "@/lib/links"
import { ShareTargetView } from "./ShareTargetView"

export const metadata = { title: "Add to Bundel" }

interface PageProps {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>
}

// Landing page for the PWA share target: pick which Bundel the shared link goes in.
export default async function SharePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const session = await auth()
  const query = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/share?${query}`)}`)

  const url = findUrl(sp.url) ?? findUrl(sp.text) ?? findUrl(sp.title)

  const bundels = await prisma.linkLink.findMany({
    where: { userId: session.user.id, type: "NORMAL" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      avatar: true,
      _count: { select: { links: true } },
      user: { select: { username: true, image: true } },
    },
  })

  return <ShareTargetView url={url} sharedTitle={sp.title ?? null} bundels={bundels} />
}
