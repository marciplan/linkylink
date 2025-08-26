import { notFound } from "next/navigation"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { incrementViews } from "@/lib/actions"
import { auth } from "@/lib/auth"
import PublicLinkView from "./PublicLinkView"

interface PageProps {
  params: Promise<{
    username: string
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params
  
  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: { user: true },
    // Note: headerImage, headerPrompt, headerImages are included by default
  })

  if (!linkylink || linkylink.user.username !== username) {
    return {}
  }

  const ogImageUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/og/${slug}`

  return {
    title: `${linkylink.title} - LinkyLink`,
    description: linkylink.subtitle || `Check out ${linkylink.title} by @${linkylink.user.username}`,
    openGraph: {
      title: linkylink.title,
      description: linkylink.subtitle || `Check out ${linkylink.title} by @${linkylink.user.username}`,
      images: [ogImageUrl],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: linkylink.title,
      description: linkylink.subtitle || `Check out ${linkylink.title} by @${linkylink.user.username}`,
      images: [ogImageUrl],
    },
  }
}

export default async function PublicLinkylinkPage({ params }: PageProps) {
  const { username, slug } = await params
  const session = await auth()
  
  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: {
      user: true,
      links: {
        orderBy: { order: "asc" },
      },
    },
    // Note: headerImage, headerPrompt, headerImages are included by default
  })

  if (!linkylink || linkylink.user.username !== username) {
    notFound()
  }

  // Check if current user is the owner
  const isOwner = session?.user?.id === linkylink.userId

  // Increment views (don't await to not block rendering)
  incrementViews(slug)

  return <PublicLinkView linkylink={linkylink} isOwner={isOwner} />
}