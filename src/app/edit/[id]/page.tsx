import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import EditLinkylinkView from "./EditLinkylinkView"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditLinkylinkPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const linkylink = await prisma.linkLink.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      links: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (!linkylink) {
    notFound()
  }

  return (
    <EditLinkylinkView
      linkylink={linkylink}
      username={session.user.username || session.user.email?.split("@")[0] || "user"}
    />
  )
}