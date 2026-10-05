"use client"

import { useState } from "react"
import { ArrowUpRight, Trash2 } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Button, buttonStyles } from "@/components/ui/button"
import { Field, Input, Textarea } from "@/components/ui/field"
import { isProbablyUrl, normalizeUrl } from "@/lib/links"
import type { BundelLink } from "./LinkRow"

interface EditLinkSheetProps {
  link: BundelLink | null
  onOpenChange: (open: boolean) => void
  /** Called with only the fields that changed, when the sheet closes. */
  onSave: (id: string, changes: { title?: string; url?: string; context?: string | null }) => void
  onDelete: (id: string) => void
}

/** Edits apply when the sheet is dismissed — there is no separate save step. */
export function EditLinkSheet({ link, onOpenChange, onSave, onDelete }: EditLinkSheetProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [note, setNote] = useState("")
  const [loaded, setLoaded] = useState<BundelLink | null>(null)

  // Load the fields whenever a different link is opened.
  if (link && link !== loaded) {
    setLoaded(link)
    setTitle(link.title)
    setUrl(link.url)
    setNote(link.context ?? "")
  }

  const commit = () => {
    if (!link) return
    const changes: { title?: string; url?: string; context?: string | null } = {}
    if (title.trim() && title.trim() !== link.title) changes.title = title.trim()
    if (isProbablyUrl(url) && normalizeUrl(url) !== link.url) changes.url = normalizeUrl(url)
    if (note.trim() !== (link.context ?? "")) changes.context = note.trim() || null
    if (Object.keys(changes).length) onSave(link.id, changes)
  }

  const close = (open: boolean) => {
    if (!open) commit()
    onOpenChange(open)
  }

  return (
    <Sheet
      open={!!link}
      onOpenChange={close}
      title="Edit link"
      footer={
        <Button variant="primary" size="lg" onClick={() => close(false)}>
          Done
        </Button>
      }
    >
      <div className="space-y-4 pt-2">
        <Field label="Title" htmlFor="edit-link-title">
          <Input id="edit-link-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
        </Field>
        <Field
          label="Link"
          htmlFor="edit-link-url"
          error={url && !isProbablyUrl(url) ? "That doesn't look like a link" : undefined}
        >
          <Input
            id="edit-link-url"
            type="url"
            inputMode="url"
            autoCapitalize="off"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </Field>
        <Field label="Your note" hint={`${note.length}/280 · shown under the link`} htmlFor="edit-link-note">
          <Textarea
            id="edit-link-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            rows={3}
            placeholder="Why should people open this? (optional)"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {link && (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "secondary", size: "md" })}>
              Open
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          <Button
            variant="danger"
            onClick={() => {
              if (!link) return
              onOpenChange(false)
              onDelete(link.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
