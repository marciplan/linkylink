"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, Reorder, useDragControls, useReducedMotion, type PanInfo } from "framer-motion"
import { toast } from "sonner"
import {
  Check, ChevronLeft, Eye, GripVertical, Link2, MoreHorizontal, Paintbrush, Plus, Share, Trash2, Vote, X,
} from "lucide-react"
import { BundelHero } from "@/components/bundel/BundelHero"
import { LinkRowBody, type BundelLink } from "@/components/bundel/LinkRow"
import { TopBar } from "@/components/bundel/TopBar"
import { linkRowStyles, topBarButton } from "@/components/bundel/styles"
import { AddLinkSheet, type NewLink } from "@/components/bundel/AddLinkSheet"
import { EditLinkSheet } from "@/components/bundel/EditLinkSheet"
import { AppearanceSheet } from "@/components/bundel/AppearanceSheet"
import { Sheet, ListGroup, ListAction } from "@/components/ui/sheet"
import { Button, buttonStyles } from "@/components/ui/button"
import { addLink, deleteLink, deleteLinkylink, updateLink, updateLinkOrder, updateLinkylink } from "@/lib/actions"
import { bundelIcon } from "@/lib/bundel-icon"
import { bundelHue } from "@/lib/theme"
import { copyText, shareOrCopy } from "@/lib/share"
import { acceptSuggestion, declineSuggestion } from "@/lib/sharing-actions"
import { AskProvider, type AskSettings } from "@/components/bundel/ask/AskProvider"
import { AskCard } from "@/components/bundel/ask/AskCard"
import { VoteBar } from "@/components/bundel/ask/VoteBar"
import { AskSettingsSheet } from "@/components/bundel/ask/AskSettingsSheet"
import { Favicon } from "@/components/bundel/Favicon"
import { domainOf } from "@/lib/links"
import type { VoteSummary } from "@/lib/sharing"

interface BundelOwnerViewProps {
  bundel: {
    id: string
    slug: string
    title: string
    subtitle: string | null
    avatar: string | null
    headerImage: string | null
    headerImages: string[]
    views: number
    user: { username: string; image: string | null }
    links: BundelLink[]
  }
  commentCounts: Record<string, number>
  ask: AskSettings | null
  voteSummary: VoteSummary
  suggestions: { id: string; url: string; title: string; note: string | null; name: string }[]
  remixedFrom: { title: string; path: string; username: string } | null
}

/** Text that is edited in place and saved when it loses focus. */
function InlineText({
  value, onCommit, placeholder, className, maxLength, label,
}: {
  value: string
  onCommit: (value: string) => void
  placeholder: string
  className?: string
  maxLength: number
  label: string
}) {
  // Callers key this on `value`, so a new saved value starts a fresh draft.
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  // Grow with the content so long titles wrap like the visitor view.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={draft}
      maxLength={maxLength}
      aria-label={label}
      placeholder={placeholder}
      enterKeyHint="done"
      onChange={(e) => setDraft(e.target.value.replace(/\n/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        }
        if (e.key === "Escape") {
          setDraft(value)
          requestAnimationFrame(() => ref.current?.blur())
        }
      }}
      onBlur={() => {
        const next = draft.trim()
        if (next !== value) onCommit(next)
      }}
      className={
        "block w-full resize-none overflow-hidden rounded-xl bg-transparent outline-none transition-colors " +
        "placeholder:text-white/60 hover:bg-white/10 focus:bg-white/15 focus:ring-2 focus:ring-white/50 -mx-2 px-2 " +
        (className ?? "")
      }
    />
  )
}

function OwnerLinkRow({
  link, commentCount, onOpen, onDelete, onDragEnd, footer,
}: {
  link: BundelLink
  commentCount: number
  onOpen: () => void
  onDelete: () => void
  onDragEnd: () => void
  /** Shown inside the card under the link, e.g. vote results. */
  footer?: React.ReactNode
}) {
  const controls = useDragControls()
  const reduceMotion = useReducedMotion()
  const swiped = useRef(false)

  const handleSwipeEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -110 || info.velocity.x < -600) onDelete()
    // Swallow the click that follows a drag.
    setTimeout(() => (swiped.current = false), 0)
  }

  return (
    <Reorder.Item
      value={link}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="relative list-none"
      whileDrag={reduceMotion ? undefined : { scale: 1.03, zIndex: 10 }}
    >
      {/* Revealed behind the row as it is swiped left. */}
      <div className="absolute inset-0 flex items-center justify-end rounded-3xl bg-danger pr-6 text-white" aria-hidden>
        <Trash2 className="h-5 w-5" />
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0 }}
        onDragStart={() => (swiped.current = true)}
        onDragEnd={handleSwipeEnd}
        className={footer ? "relative rounded-3xl bg-surface shadow-card ring-1 ring-line/50" : "relative"}
      >
        <button
          type="button"
          onClick={() => !swiped.current && onOpen()}
          className={footer ? "pressable block w-full rounded-3xl p-4 pb-3 text-left" : linkRowStyles}
          aria-label={`Edit ${link.title}`}
        >
          <LinkRowBody link={link} commentCount={commentCount} />
        </button>
        {footer}
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          aria-label="Drag to reorder"
          className="absolute right-2.5 top-2.5 grid h-10 w-10 cursor-grab touch-none place-items-center rounded-full text-ink-3 hover:bg-ink/5 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </motion.div>
    </Reorder.Item>
  )
}

/** Provides vote results to the owner's rows when the Bundel is in Ask mode. */
function MaybeAsk({ bundelId, ask, summary, ownerName, children }: { bundelId: string; ask: AskSettings | null; summary: VoteSummary; ownerName: string; children: React.ReactNode }) {
  if (!ask) return <>{children}</>
  return (
    <AskProvider bundelId={bundelId} ask={ask} initialSummary={summary} ownerName={ownerName} signedInAs={ownerName} readOnly>
      {children}
    </AskProvider>
  )
}

export default function BundelOwnerView({ bundel, commentCounts, ask: initialAsk, voteSummary, suggestions: initialSuggestions, remixedFrom }: BundelOwnerViewProps) {
  const router = useRouter()
  const [title, setTitle] = useState(bundel.title)
  const [subtitle, setSubtitle] = useState(bundel.subtitle ?? "")
  const [avatar, setAvatar] = useState(bundel.avatar)
  const [headerImage, setHeaderImage] = useState(bundel.headerImage)
  const [links, setLinks] = useState(bundel.links)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<BundelLink | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [ask, setAsk] = useState(initialAsk)
  const [askOpen, setAskOpen] = useState(false)
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const linksRef = useRef(links)
  useEffect(() => {
    linksRef.current = links
  }, [links])

  // Removals wait for the undo window before hitting the server.
  const pendingDeletes = useRef(new Map<string, () => void>())
  useEffect(() => {
    const flush = () => pendingDeletes.current.forEach((commit) => commit())
    window.addEventListener("pagehide", flush)
    return () => {
      window.removeEventListener("pagehide", flush)
      flush()
    }
  }, [])

  const hue = bundelHue(bundel.slug)
  const icon = bundelIcon(avatar, bundel.user.image, title)
  const path = `/${bundel.user.username}/${bundel.slug}`

  const saveBundel = async (data: Parameters<typeof updateLinkylink>[1]) => {
    try {
      await updateLinkylink(bundel.id, data)
    } catch {
      toast.error("Couldn't save that change")
    }
  }

  const handleAdd = async ({ title, url, context }: NewLink) => {
    const temp: BundelLink = { id: `temp-${Date.now()}`, title, url, context: context ?? null, favicon: null, likes: 0 }
    setLinks((l) => [...l, temp])
    try {
      const created = await addLink({ linkylinkId: bundel.id, title, url, context })
      setLinks((l) => l.map((x) => (x.id === temp.id ? { ...created, likes: 0 } : x)))
      requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }))
    } catch {
      setLinks((l) => l.filter((x) => x.id !== temp.id))
      toast.error("Couldn't add that link")
      throw new Error("add failed")
    }
  }

  const handleDelete = useCallback((id: string) => {
    const index = linksRef.current.findIndex((l) => l.id === id)
    const removed = linksRef.current[index]
    if (!removed) return
    setLinks((l) => l.filter((x) => x.id !== id))

    let settled = false
    const commit = () => {
      if (settled) return
      settled = true
      pendingDeletes.current.delete(id)
      deleteLink(id).catch(() => {
        toast.error("Couldn't remove that link")
        router.refresh()
      })
    }
    pendingDeletes.current.set(id, commit)

    toast("Link removed", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          settled = true
          pendingDeletes.current.delete(id)
          setLinks((l) => {
            const next = [...l]
            next.splice(Math.min(index, next.length), 0, removed)
            return next
          })
        },
      },
      onAutoClose: commit,
      onDismiss: commit,
    })
  }, [router])

  const handleEdit = async (id: string, changes: { title?: string; url?: string; context?: string | null }) => {
    const before = linksRef.current
    setLinks((l) => l.map((x) => (x.id === id ? { ...x, ...changes } : x)))
    try {
      const updated = await updateLink(id, changes)
      setLinks((l) => l.map((x) => (x.id === id ? { ...x, favicon: updated.favicon } : x)))
    } catch {
      setLinks(before)
      toast.error("Couldn't save that link")
    }
  }

  const persistOrder = () => {
    const ids = linksRef.current.filter((l) => !l.id.startsWith("temp-")).map((l) => l.id)
    updateLinkOrder(bundel.id, ids).catch(() => toast.error("Couldn't save the new order"))
  }

  const removeBundel = async () => {
    await deleteLinkylink(bundel.id)
    toast("Bundel deleted")
    router.push("/dashboard")
  }

  const acceptOne = async (id: string) => {
    setSuggestions((list) => list.filter((x) => x.id !== id))
    try {
      const link = await acceptSuggestion(id)
      setLinks((l) => [...l, { ...link, likes: 0 }])
      toast("Added to your Bundel")
    } catch {
      setSuggestions(initialSuggestions)
      toast.error("Couldn't add that suggestion")
    }
  }

  const declineOne = async (id: string) => {
    setSuggestions((list) => list.filter((x) => x.id !== id))
    declineSuggestion(id).catch(() => toast.error("Couldn't dismiss that suggestion"))
  }

  const shareBundel = () =>
    shareOrCopy({
      title,
      text: ask ? `Help me pick: ${ask.question || title}` : subtitle || undefined,
      url: window.location.origin + path,
    })

  return (
    <div data-tint style={{ "--tint-h": hue } as React.CSSProperties} className="min-h-dvh bg-bg">
      {/* Sheets render in a portal outside this element, so set the hue page-wide too. */}
      <style>{`:root{--tint-h:${hue}}`}</style>
      <TopBar
        title={title || "Untitled"}
        leading={
          <Link href="/dashboard" className={topBarButton} aria-label="Back to your Bundels">
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        }
        trailing={
          <>
            <Link href={`${path}?view=public`} className={topBarButton} aria-label="Preview as a visitor">
              <Eye className="h-[18px] w-[18px]" />
            </Link>
            <button onClick={() => setMenuOpen(true)} className={topBarButton} aria-label="More options">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </>
        }
      />

      <BundelHero
        hue={hue}
        headerImage={headerImage}
        icon={icon}
        iconAction={
          <button
            onClick={() => setAppearanceOpen(true)}
            aria-label="Change icon and background"
            className="pressable absolute -bottom-1.5 -right-1.5 grid h-8 w-8 place-items-center rounded-full bg-white text-ink shadow-float"
          >
            <Paintbrush className="h-4 w-4" />
          </button>
        }
        title={
          <InlineText
            key={title}
            label="Bundel title"
            value={title}
            maxLength={100}
            placeholder="Name this Bundel"
            onCommit={(v) => {
              if (!v) return
              setTitle(v)
              saveBundel({ title: v })
            }}
          />
        }
        subtitle={
          <InlineText
            key={subtitle}
            label="Bundel description"
            value={subtitle}
            maxLength={200}
            placeholder="Add a short description"
            onCommit={(v) => {
              setSubtitle(v)
              saveBundel({ subtitle: v })
            }}
          />
        }
        meta={
          <>
            <span>@{bundel.user.username}</span>
            <span aria-hidden>·</span>
            <span>{links.length} {links.length === 1 ? "link" : "links"}</span>
            <span aria-hidden>·</span>
            <span>{bundel.views.toLocaleString()} views</span>
            {remixedFrom && (
              <>
                <span aria-hidden>·</span>
                <Link href={remixedFrom.path} className="underline decoration-white/40 underline-offset-4">
                  Remixed from @{remixedFrom.username}
                </Link>
              </>
            )}
          </>
        }
      />
      <div id="hero-end" aria-hidden />

      <MaybeAsk bundelId={bundel.id} ask={ask} summary={voteSummary} ownerName={bundel.user.username}>
      <main className="relative -mt-6 rounded-t-4xl bg-bg pb-40 pt-5">
        <div className="mx-auto max-w-2xl space-y-3 px-4">
          {suggestions.length > 0 && (
            <section aria-label="Suggestions" className="rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line/50">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">
                {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"} waiting
              </h2>
              <ul className="mt-2 divide-y divide-line/70">
                {suggestions.map((sug) => (
                  <li key={sug.id} className="flex items-start gap-3 py-3">
                    <Favicon url={sug.url} size={40} />
                    <div className="min-w-0 flex-1">
                      <a href={sug.url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 font-semibold leading-snug hover:underline">
                        {sug.title}
                      </a>
                      <p className="truncate text-[13px] text-ink-3">{domainOf(sug.url)} · from {sug.name}</p>
                      {sug.note && <p className="mt-1 text-[14px] text-ink-2 text-pretty">“{sug.note}”</p>}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => declineOne(sug.id)} aria-label={`Dismiss ${sug.title}`} className="pressable grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-ink-2">
                        <X className="h-4 w-4" />
                      </button>
                      <button onClick={() => acceptOne(sug.id)} aria-label={`Add ${sug.title}`} className="pressable grid h-10 w-10 place-items-center rounded-full bg-ink text-bg">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {ask && <AskCard titles={Object.fromEntries(links.map((l) => [l.id, l.title]))} onEdit={() => setAskOpen(true)} />}
          {links.length === 0 ? (
            <button
              onClick={() => setAdding(true)}
              className="pressable flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-tint-soft text-tint-ink">
                <Plus className="h-7 w-7" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-semibold">Add your first link</span>
              <span className="max-w-xs text-sm text-ink-2 text-pretty">
                Paste any link. We&apos;ll grab the title for you.
              </span>
            </button>
          ) : (
            <>
              <Reorder.Group axis="y" values={links} onReorder={setLinks} className="space-y-2.5">
                {links.map((link) => (
                  <OwnerLinkRow
                    key={link.id}
                    link={link}
                    commentCount={commentCounts[link.id] ?? 0}
                    onOpen={() => !link.id.startsWith("temp-") && setEditing(link)}
                    onDelete={() => handleDelete(link.id)}
                    onDragEnd={persistOrder}
                    footer={ask ? <VoteBar linkId={link.id} title={link.title} /> : undefined}
                  />
                ))}
              </Reorder.Group>
              <p className="mt-4 text-center text-[13px] text-ink-3">
                Tap to edit · Drag <GripVertical className="inline h-3 w-3 align-[-1px]" /> to reorder · Swipe left to remove
              </p>
            </>
          )}
        </div>
      </main>
      </MaybeAsk>

      {/* Owner actions in the thumb zone */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-safe">
        <div className="glass pointer-events-auto mb-1 flex w-full max-w-sm items-center gap-2 rounded-full border border-line/60 p-1.5 shadow-float">
          <Button variant="primary" size="md" className="flex-1" onClick={() => setAdding(true)}>
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            Add link
          </Button>
          <Button variant="secondary" size="icon" onClick={shareBundel} aria-label="Share">
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <AddLinkSheet open={adding} onOpenChange={setAdding} onAdd={handleAdd} />

      <EditLinkSheet
        link={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={handleEdit}
        onDelete={handleDelete}
      />

      <AskSettingsSheet open={askOpen} onOpenChange={setAskOpen} bundelId={bundel.id} ask={ask} onChange={setAsk} />

      <AppearanceSheet
        open={appearanceOpen}
        onOpenChange={setAppearanceOpen}
        bundel={{ id: bundel.id, title, subtitle, headerImages: bundel.headerImages }}
        hue={hue}
        icon={icon.kind === "emoji" ? icon.value : ""}
        headerImage={headerImage}
        onIconChange={(emoji) => {
          setAvatar(emoji)
          saveBundel({ avatar: emoji })
        }}
        onHeaderChange={(image) => {
          setHeaderImage(image)
          saveBundel({ headerImage: image })
        }}
      />

      <Sheet
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open)
          if (!open) setConfirmDelete(false)
        }}
        title={title || "Bundel"}
        description={`bundel.link${path}`}
      >
        {confirmDelete ? (
          <div className="space-y-3 pt-2">
            <p className="text-[15px] text-ink-2 text-pretty">
              This permanently deletes &ldquo;{title}&rdquo; and its {links.length} {links.length === 1 ? "link" : "links"}, including likes and comments.
            </p>
            <Button variant="danger" size="lg" onClick={removeBundel}>
              <Trash2 className="h-5 w-5" />
              Delete Bundel
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <ListGroup>
              <ListAction icon={<Share className="h-5 w-5" />} label="Share" onClick={shareBundel} />
              <ListAction
                icon={<Link2 className="h-5 w-5" />}
                label="Copy link"
                onClick={() => copyText(window.location.origin + path)}
              />
              <ListAction
                icon={<Vote className="h-5 w-5" />}
                label="Ask for votes"
                hint={ask ? "On" : "Off"}
                onClick={() => {
                  setMenuOpen(false)
                  setAskOpen(true)
                }}
              />
              <ListAction
                icon={<Paintbrush className="h-5 w-5" />}
                label="Appearance"
                onClick={() => {
                  setMenuOpen(false)
                  setAppearanceOpen(true)
                }}
              />
            </ListGroup>
            <Link href={`${path}?view=public`} className={buttonStyles({ variant: "secondary", size: "lg" })}>
              <Eye className="h-5 w-5" />
              Preview as a visitor
            </Link>
            <ListGroup>
              <ListAction
                tone="danger"
                icon={<Trash2 className="h-5 w-5" />}
                label="Delete Bundel"
                onClick={() => setConfirmDelete(true)}
              />
            </ListGroup>
          </div>
        )}
      </Sheet>
    </div>
  )
}
