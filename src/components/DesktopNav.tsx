"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Link2, Plus, Search, Sparkles } from "lucide-react"
import { useSyncExternalStore } from "react"
import { OPEN_PALETTE_EVENT } from "@/components/palette-event"
import { Avatar } from "@/components/Avatar"
import { buttonStyles } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DesktopNavProps {
  user: { username: string; image: string | null }
}

const items = [
  { href: "/dashboard", label: "Bundels", match: ["/dashboard"] },
  { href: "/recommendations", label: "Tidy up", match: ["/recommendations"], icon: Sparkles },
  { href: "/account", label: "Account", match: ["/account"] },
]

/**
 * The signed-in app's top bar on desktop. Phones keep the floating tab bar, so this
 * only shows from the `lg` breakpoint up.
 */
const noop = () => () => {}

export function DesktopNav({ user }: DesktopNavProps) {
  const pathname = usePathname()
  const mac = useSyncExternalStore(noop, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false)

  return (
    <header className="glass sticky top-0 z-50 hidden border-b border-line/60 lg:block">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-8">
        <Link href="/dashboard" className="pressable mr-6 inline-flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-bg">
            <Link2 className="h-4 w-4" strokeWidth={2.5} />
          </span>
          Bundel
        </Link>

        <div className="flex items-center gap-1">
          {items.map((item) => {
            const active = item.match.some((m) => pathname === m || pathname.startsWith(m + "/"))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition-colors",
                  active ? "bg-ink/[0.07] text-ink" : "text-ink-2 hover:bg-ink/5 hover:text-ink"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
            className="pressable hidden h-9 items-center gap-2 rounded-full bg-surface-2 pl-3 pr-2 text-[14px] text-ink-3 transition-colors hover:bg-ink/10 xl:inline-flex"
          >
            <Search className="h-3.5 w-3.5" />
            Search
            <kbd className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-ink-2 shadow-sm">{mac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <Link href="/create" className={buttonStyles({ size: "sm" })}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Bundel
          </Link>
          <Link href={`/${user.username}`} aria-label="Your public page" className="pressable rounded-full ring-1 ring-line/80 transition-shadow hover:ring-2 hover:ring-ink/20">
            <Avatar src={user.image} username={user.username} size={36} />
          </Link>
        </div>
      </nav>
    </header>
  )
}
