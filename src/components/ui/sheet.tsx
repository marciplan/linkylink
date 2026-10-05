"use client"

import { Drawer } from "vaul"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  /** Visually hide the title (still read by screen readers). */
  hideTitle?: boolean
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Rendered pinned below the scrollable body, e.g. a primary action. */
  footer?: React.ReactNode
  /** Element to focus when the sheet opens (defaults to the first focusable). */
  initialFocusRef?: React.RefObject<HTMLElement | null>
}

/**
 * Bottom sheet — the one overlay pattern for the app. Drag down or tap the
 * scrim to dismiss; content scrolls inside while the handle stays put.
 */
export function Sheet({ open, onOpenChange, title, hideTitle, description, children, className, footer, initialFocusRef }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]" />
        <Drawer.Content
          onOpenAutoFocus={(e) => {
            if (!initialFocusRef?.current) return
            e.preventDefault()
            initialFocusRef.current.focus()
          }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[61] mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col",
            "rounded-t-4xl bg-surface text-ink shadow-float outline-none",
            "sm:bottom-4 sm:rounded-4xl",
            className
          )}
        >
          <div className="flex shrink-0 items-start gap-3 px-5 pb-2 pt-3">
            <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-ink/15" aria-hidden />
            <div className={cn("min-w-0 flex-1 pt-4", hideTitle && "sr-only")}>
              <Drawer.Title className="text-title text-balance">{title}</Drawer.Title>
              {description ? (
                <Drawer.Description className="mt-1 text-sm text-ink-2 text-pretty">{description}</Drawer.Description>
              ) : (
                <Drawer.Description className="sr-only">{typeof title === "string" ? title : "Sheet"}</Drawer.Description>
              )}
            </div>
            <Drawer.Close
              className="pressable mt-3 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
          {footer && <div className="shrink-0 border-t border-line/60 px-5 pt-3 pb-safe">{footer}</div>}
          {!footer && <div className="pb-safe" />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

/** Grouped list container used inside sheets and settings screens. */
export function ListGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-surface-2/70 divide-y divide-line/70", className)}>
      {children}
    </div>
  )
}

interface ListActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  label: React.ReactNode
  hint?: React.ReactNode
  tone?: "default" | "danger"
}

export function ListAction({ icon, label, hint, tone = "default", className, ...props }: ListActionProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-medium transition-colors active:bg-ink/5",
        tone === "danger" ? "text-danger" : "text-ink",
        className
      )}
      {...props}
    >
      {icon && <span className={cn("grid h-5 w-5 place-items-center", tone === "danger" ? "text-danger" : "text-ink-2")}>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && <span className="shrink-0 text-sm text-ink-3">{hint}</span>}
    </button>
  )
}
