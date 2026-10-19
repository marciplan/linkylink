import { auth } from "@/lib/auth"
import { CommandPaletteLoader } from "@/components/CommandPaletteLoader"
import { DesktopNav } from "@/components/DesktopNav"
import { MobileNav } from "@/components/MobileNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user

  return (
    <div className="min-h-dvh pb-32 lg:pb-16">
      {user?.username && <DesktopNav user={{ username: user.username, image: user.image ?? null }} />}
      {user?.username && <CommandPaletteLoader username={user.username} />}
      {children}
      <MobileNav />
    </div>
  )
}
