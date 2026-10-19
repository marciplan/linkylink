"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarHeart, CornerDownLeft, Home, Monitor, Moon, Plus, Search, Sparkles, Sun, UserRound } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { useTheme } from "@/components/theme-provider"
import { bundelIcon } from "@/lib/bundel-icon"
import { cn } from "@/lib/utils"

import { OPEN_PALETTE_EVENT } from "@/components/palette-event"

interface Item {
  id: string
  label: string
  hint?: string
  icon: React.ReactNode
  run: () => void
}

interface BundelHit {
  id: string
  title: string
  slug: string
  username: string
  avatar: string | null
  linkCount: number
}

/** ⌘K (or /) to jump anywhere: your Bundels, new things, settings. Desktop only. */
export default function CommandPalette({ username }: { username: string }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<{ q: string; items: BundelHit[] }>({ q: "", items: [] })
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
    setActive(0)
  }, [])

  // Global shortcuts.
  useEffect(() => {
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && !!el.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector("[role=dialog]")) return
      if (e.key === "/") {
        e.preventDefault()
        setOpen(true)
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault()
        router.push("/create")
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen)
    }
  }, [router])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Bundel search, debounced; answers are keyed by query so stale ones never show.
  const q = query.trim()
  useEffect(() => {
    if (!open || !q) return
    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-linkylinks?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        if (res.ok) setHits({ q, items: (await res.json()).results ?? [] })
      } catch {
        // Aborted or offline: keep what is on screen.
      }
    }, 180)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [q, open])

  const go = useCallback(
    (href: string) => () => {
      close()
      router.push(href)
    },
    [close, router]
  )

  const items = useMemo<Item[]>(() => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    const commands: Item[] = [
      { id: "new", label: "New Bundel", hint: "N", icon: <Plus className="h-4 w-4" />, run: go("/create") },
      { id: "year", label: "New year in review", icon: <CalendarHeart className="h-4 w-4" />, run: go("/create/year-review") },
      { id: "home", label: "Your Bundels", icon: <Home className="h-4 w-4" />, run: go("/dashboard") },
      { id: "tidy", label: "Tidy up", icon: <Sparkles className="h-4 w-4" />, run: go("/recommendations") },
      { id: "me", label: "Your public page", icon: <UserRound className="h-4 w-4" />, run: go(`/${username}`) },
      { id: "account", label: "Account", icon: <Monitor className="h-4 w-4" />, run: go("/account") },
      {
        id: "theme",
        label: `Switch to ${nextTheme} mode`,
        icon: nextTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />,
        run: () => {
          setTheme(nextTheme)
          close()
        },
      },
    ]
    const matching = q ? commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())) : commands
    const found: Item[] =
      hits.q === q
        ? hits.items.map((b) => {
            const icon = bundelIcon(b.avatar, null, b.title)
            return {
              id: `b-${b.id}`,
              label: b.title,
              hint: `${b.linkCount} ${b.linkCount === 1 ? "link" : "links"}`,
              icon: icon.kind === "emoji" ? <FluentEmoji emoji={icon.value} size={20} /> : <Search className="h-4 w-4" />,
              run: go(`/${b.username}/${b.slug}`),
            }
          })
        : []
    return [...found, ...matching]
  }, [theme, q, hits, go, username, setTheme, close])

  const current = Math.min(active, Math.max(items.length - 1, 0))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-[14vh] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="w-full max-w-xl overflow-hidden rounded-3xl bg-surface text-ink shadow-float ring-1 ring-line/60">
        <div className="flex items-center gap-3 border-b border-line/60 px-5">
          <Search className="h-5 w-5 shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") close()
              else if (e.key === "ArrowDown") {
                e.preventDefault()
                setActive(Math.min(current + 1, items.length - 1))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActive(Math.max(current - 1, 0))
              } else if (e.key === "Enter") {
                e.preventDefault()
                items[current]?.run()
              }
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[current] ? `palette-${items[current].id}` : undefined}
            placeholder="Search your Bundels, or jump to…"
            className="h-14 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-3"
          />
          <kbd className="hidden rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-ink-3 sm:block">esc</kbd>
        </div>
        <ul id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-8 text-center text-[15px] text-ink-3">Nothing found</li>}
          {items.map((item, i) => (
            <li key={item.id} id={`palette-${item.id}`} role="option" aria-selected={i === current}>
              <button
                type="button"
                onMouseMove={() => setActive(i)}
                onClick={item.run}
                className={cn("flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium", i === current ? "bg-ink/[0.06]" : "")}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center text-ink-2">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint && <span className="shrink-0 text-[13px] text-ink-3">{item.hint}</span>}
                {i === current && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink-3" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
