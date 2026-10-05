"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Sun, Moon, Monitor, Sparkles, Info, Shield, LogOut, ChevronRight, UserRound } from "lucide-react"
import { Avatar } from "@/components/Avatar"
import { ListGroup } from "@/components/ui/sheet"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface AccountViewProps {
  user: { username: string; name: string | null; email: string; image: string | null }
  bundelCount: number
  totalViews: number
}

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
] as const

function RowLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex min-h-[52px] items-center gap-3 px-4 text-[15px] font-medium active:bg-ink/5">
      <span className="text-ink-2">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-ink-3" />
    </Link>
  )
}

export function AccountView({ user, bundelCount, totalViews }: AccountViewProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4">
      <div className="flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-card">
        <Avatar src={user.image} username={user.username} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{user.name || user.username}</p>
          <p className="truncate text-sm text-ink-2">@{user.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-surface p-4 shadow-card">
          <p className="text-2xl font-bold tabular-nums">{bundelCount}</p>
          <p className="text-sm text-ink-2">{bundelCount === 1 ? "Bundel" : "Bundels"}</p>
        </div>
        <div className="rounded-3xl bg-surface p-4 shadow-card">
          <p className="text-2xl font-bold tabular-nums">{totalViews.toLocaleString()}</p>
          <p className="text-sm text-ink-2">Total views</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Appearance</h2>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={cn(
                "pressable flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold",
                theme === value ? "bg-surface text-ink shadow-card" : "text-ink-2"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <ListGroup className="bg-surface shadow-card">
        <RowLink href={`/${user.username}`} icon={<UserRound className="h-5 w-5" />} label="Your public page" />
        <RowLink href="/recommendations" icon={<Sparkles className="h-5 w-5" />} label="Tidy up suggestions" />
        <RowLink href="/about" icon={<Info className="h-5 w-5" />} label="About Bundel" />
        <RowLink href="/privacy" icon={<Shield className="h-5 w-5" />} label="Privacy" />
      </ListGroup>

      <ListGroup className="bg-surface shadow-card">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-[15px] font-medium text-danger active:bg-ink/5"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </ListGroup>

      <p className="pb-4 text-center text-xs text-ink-3">Signed in as {user.email}</p>
    </div>
  )
}
