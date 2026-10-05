"use client"

import { useEffect, useRef, useState } from "react"
import { ClipboardPaste, Loader2, Plus } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Field, Input, Textarea } from "@/components/ui/field"
import { domainOf, isProbablyUrl, normalizeUrl, titleFromUrl } from "@/lib/links"
import { useCanPaste } from "@/lib/use-can-paste"
import { Favicon } from "./Favicon"

export interface NewLink {
  title: string
  url: string
  context?: string
}

interface Unfurl {
  title: string
  siteName: string
  favicon: string | null
}

/** Debounced page lookup for a URL being typed or pasted. */
export function useUnfurl(rawUrl: string) {
  // Results are keyed by URL so stale answers never show for a newer URL.
  const [result, setResult] = useState<{ url: string; data: Unfurl | null } | null>(null)
  const valid = isProbablyUrl(rawUrl)
  const url = valid ? normalizeUrl(rawUrl) : ""

  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/unfurl?url=${encodeURIComponent(url)}`, { signal: controller.signal })
        setResult({ url, data: res.ok ? await res.json() : null })
      } catch {
        // Aborted or offline: keep the URL-derived title
        if (!controller.signal.aborted) setResult({ url, data: null })
      }
    }, 350)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [url])

  const settled = result?.url === url
  return { url, valid, data: settled ? result.data : null, loading: !!url && !settled }
}

interface AddLinkSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (link: NewLink) => Promise<void> | void
  initialUrl?: string
}

export function AddLinkSheet({ open, onOpenChange, onAdd, initialUrl = "" }: AddLinkSheetProps) {
  const [rawUrl, setRawUrl] = useState(initialUrl)
  // null = follow the suggested title; a string = the user's own edit
  const [titleEdit, setTitleEdit] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  const canPaste = useCanPaste()
  const urlRef = useRef<HTMLInputElement>(null)
  const { url, valid, data, loading } = useUnfurl(rawUrl)

  // Start fresh each time the sheet opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setRawUrl(initialUrl)
      setTitleEdit(null)
      setNote("")
    }
  }

  const title = titleEdit ?? (data?.title || (valid ? titleFromUrl(url) : ""))

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setRawUrl(text.trim())
    } catch {
      urlRef.current?.focus()
    }
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!valid || !title.trim() || submitting) return
    setSubmitting(true)
    try {
      await onAdd({ title: title.trim().slice(0, 100), url, context: note.trim() || undefined })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      initialFocusRef={urlRef}
      title="Add a link"
      footer={
        <Button variant="primary" size="lg" disabled={!valid || !title.trim() || submitting} onClick={() => submit()}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" strokeWidth={2.5} />}
          Add link
        </Button>
      }
    >
      <form onSubmit={submit} className="space-y-4 pt-2">
        <div className="relative">
          <Input
            ref={urlRef}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="next"
            value={rawUrl}
            onChange={(e) => setRawUrl(e.target.value)}
            placeholder="Paste or type a link"
            aria-label="Link"
            className="h-14 pr-28 text-[17px]"
          />
          {canPaste && !rawUrl && (
            <button
              type="button"
              onClick={paste}
              className="pressable absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-xl bg-ink px-3 text-sm font-semibold text-bg"
            >
              <ClipboardPaste className="h-4 w-4" />
              Paste
            </button>
          )}
        </div>

        {valid && (
          <div className="flex animate-rise items-center gap-3 rounded-2xl bg-tint-soft/60 p-3">
            <Favicon url={url} favicon={data?.favicon} size={40} className="bg-surface" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-tint-ink">{data?.siteName || domainOf(url)}</p>
              <p className="truncate text-[13px] text-ink-2">{url}</p>
            </div>
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-3" />}
          </div>
        )}

        {valid && (
          <>
            <Field label="Title" htmlFor="add-link-title">
              <Input
                id="add-link-title"
                value={title}
                onChange={(e) => setTitleEdit(e.target.value)}
                maxLength={100}
                enterKeyHint="done"
                placeholder="What is this?"
              />
            </Field>
            <Field label="Your note" hint={`${note.length}/280 · shown under the link`} htmlFor="add-link-note">
              <Textarea
                id="add-link-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                rows={2}
                placeholder="Why should people open this? (optional)"
              />
            </Field>
          </>
        )}
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
