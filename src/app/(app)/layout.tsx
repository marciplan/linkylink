import { MobileNav } from "@/components/MobileNav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-32">
      {children}
      <MobileNav />
    </div>
  )
}
