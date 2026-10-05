import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// Editing happens in place on the Bundel itself; keep old links working.
export default async function EditLinkylinkPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const linkylink = await prisma.linkLink.findUnique({
    where: { id, userId: session.user.id },
    select: { slug: true, user: { select: { username: true } } },
  })

  if (!linkylink) {
    notFound()
  }

  redirect(`/${linkylink.user.username}/${linkylink.slug}`)
}
