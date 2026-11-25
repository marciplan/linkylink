import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CommandPaletteLoader } from "@/components/CommandPaletteLoader"
import { DesktopNav } from "@/components/DesktopNav"
import { MobileNav } from "@/components/MobileNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user
  // From the database, not the session: the session keeps the photo from sign-in time.
  const image = user?.id ? (await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } }))?.image ?? null : null

  return (
    <div className="min-h-dvh pb-32 lg:pb-16">
      {user?.username && <DesktopNav user={{ username: user.username, image }} />}
      {user?.username && <CommandPaletteLoader username={user.username} />}
      {children}
      <MobileNav user={user?.username ? { username: user.username, image } : null} />
    </div>
  )
}
