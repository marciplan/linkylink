import { auth } from "@/lib/auth"
import { DesktopNav } from "@/components/DesktopNav"
import { MobileNav } from "@/components/MobileNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user

  return (
    <div className="min-h-dvh pb-32 lg:pb-16">
      {user?.username && <DesktopNav user={{ username: user.username, image: user.image ?? null }} />}
      {children}
      <MobileNav />
    </div>
  )
}
