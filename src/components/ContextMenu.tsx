"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Copy, ExternalLink, Link2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface MenuItem {
  label: string
  icon?: React.ReactNode
  onSelect: () => void
  danger?: boolean
}

const FINE_POINTER = "(hover: hover) and (pointer: fine)"

/**
 * Right-click menu for anything inside it. Only for mouse and trackpad: on touch screens
 * the browser's own long-press menu (open in new tab, copy link) is left alone.
 */
export function ContextMenu({ items, children }: { items: MenuItem[]; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [active, setActive] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setPos(null), [])

  useEffect(() => {
    if (!pos) return
    const onDown = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowDown") {
        e.preventDefault()
        setActive((a) => (a + 1) % items.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActive((a) => (a - 1 + items.length) % items.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        close()
        items[active]?.onSelect()
      }
    }
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("keydown", onKey)
    window.addEventListener("blur", close)
    window.addEventListener("resize", close)
    window.addEventListener("scroll", close, true)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("blur", close)
      window.removeEventListener("resize", close)
      window.removeEventListener("scroll", close, true)
    }
  }, [pos, active, items, close])

  // Keep the menu inside the window.
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!pos || !el) return
    const { width, height } = el.getBoundingClientRect()
    const x = Math.min(pos.x, window.innerWidth - width - 8)
    const y = Math.min(pos.y, window.innerHeight - height - 8)
    if (x !== pos.x || y !== pos.y) setPos({ x: Math.max(8, x), y: Math.max(8, y) })
  }, [pos])

  return (
    <div
      className="contents"
      onContextMenu={(e) => {
        if (!window.matchMedia(FINE_POINTER).matches) return
        e.preventDefault()
        setActive(0)
        setPos({ x: e.clientX, y: e.clientY })
      }}
    >
      {children}
      {pos &&
        // A portal, because rows animate with transforms and a transformed ancestor would
        // become the containing block for this fixed menu.
        createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ left: pos.x, top: pos.y }}
          className="fixed z-[80] min-w-[210px] rounded-2xl bg-surface p-1.5 text-ink shadow-float ring-1 ring-line/70"
        >
          {items.map((item, i) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onMouseMove={() => setActive(i)}
              onClick={() => {
                close()
                item.onSelect()
              }}
              className={cn(
                "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[14px] font-medium",
                item.danger ? "text-danger" : "text-ink",
                i === active && (item.danger ? "bg-danger/10" : "bg-ink/[0.06]")
              )}
            >
              <span className="grid h-4 w-4 place-items-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>,
        document.body
        )}
    </div>
  )
}

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast(message)
  } catch {
    toast.error("Couldn't copy")
  }
}

/** The menu on a visitor's link row: open it, copy it, or copy a link that points at just this one. */
export function LinkContextMenu({ url, sharePath, children }: { url: string; sharePath: string; children: React.ReactNode }) {
  return (
    <ContextMenu
      items={[
        { label: "Open in new tab", icon: <ExternalLink className="h-4 w-4" />, onSelect: () => window.open(url, "_blank", "noopener,noreferrer") },
        { label: "Copy link", icon: <Copy className="h-4 w-4" />, onSelect: () => copy(url, "Link copied") },
        { label: "Copy link to this pick", icon: <Link2 className="h-4 w-4" />, onSelect: () => copy(`${window.location.origin}${sharePath}`, "Link copied") },
      ]}
    >
      {children}
    </ContextMenu>
  )
}

/** The menu on an owner's link row. */
export function OwnerLinkContextMenu({
  url, onEdit, onDelete, children,
}: {
  url: string
  onEdit: () => void
  onDelete: () => void
  children: React.ReactNode
}) {
  return (
    <ContextMenu
      items={[
        { label: "Edit", icon: <Pencil className="h-4 w-4" />, onSelect: onEdit },
        { label: "Open in new tab", icon: <ExternalLink className="h-4 w-4" />, onSelect: () => window.open(url, "_blank", "noopener,noreferrer") },
        { label: "Copy link", icon: <Copy className="h-4 w-4" />, onSelect: () => copy(url, "Link copied") },
        { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: onDelete, danger: true },
      ]}
    >
      {children}
    </ContextMenu>
  )
}
