"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, CircleUser } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", icon: Home, label: "Home", match: ["/dashboard", "/recommendations"] },
  { href: "/create", icon: Plus, label: "New Bundel", primary: true, match: ["/create"] },
  { href: "/account", icon: CircleUser, label: "You", match: ["/account"] },
]

/**
 * Floating tab bar for the signed-in app. Sits in the thumb zone on phones and
 * stays a compact centered pill on larger screens.
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-safe"
    >
      <div className="glass pointer-events-auto mb-1 flex items-center gap-1 rounded-full border border-line/60 p-1.5 shadow-float">
        {items.map((item) => {
          const active = item.match.some((m) => pathname === m || pathname.startsWith(m + "/"))
          const Icon = item.icon

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="pressable mx-1 grid h-12 w-16 place-items-center rounded-full bg-ink text-bg"
              >
                <Icon className="h-6 w-6" strokeWidth={2.5} />
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "pressable flex h-12 min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-full px-3 text-[11px] font-semibold",
                active ? "text-ink" : "text-ink-3 hover:text-ink-2"
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
