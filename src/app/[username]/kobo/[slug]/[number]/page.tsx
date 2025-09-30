import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { incrementClicks } from "@/lib/actions"

interface PageProps {
  params: Promise<{
    username: string
    slug: string
    number: string
  }>
}

export default async function KoboLinkRedirect({ params }: PageProps) {
  const { username, slug, number } = await params

  // Parse the number (1-indexed)
  const linkNumber = parseInt(number, 10)

  if (isNaN(linkNumber) || linkNumber < 1) {
    notFound()
  }

  // Fetch the bundellink with links ordered by createdAt (oldest first, matching kobo page)
  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: {
      user: true,
      links: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!linkylink || linkylink.user.username !== username) {
    notFound()
  }

  // Get the link at the specified position (convert from 1-indexed to 0-indexed)
  const targetLink = linkylink.links[linkNumber - 1]

  if (!targetLink) {
    notFound()
  }

  // Track the click
  await incrementClicks(targetLink.id)

  // Redirect to the actual URL
  redirect(targetLink.url)
}