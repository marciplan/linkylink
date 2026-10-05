"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Field, Input, Textarea } from "@/components/ui/field"
import { Favicon } from "@/components/bundel/Favicon"
import { suggestLink } from "@/lib/sharing-actions"
import { domainOf, isProbablyUrl, normalizeUrl, titleFromUrl } from "@/lib/links"
import { getVisitor } from "@/lib/visitor"
import { useAsk } from "./AskProvider"

/** Lets a visitor propose a link; the owner approves it before it appears. */
export function SuggestSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { bundelId, ownerName, withName } = useAsk()
  const [rawUrl, setRawUrl] = useState("")
  const [titleEdit, setTitleEdit] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)

  const valid = isProbablyUrl(rawUrl)
  const url = valid ? normalizeUrl(rawUrl) : ""
  const title = titleEdit ?? (valid ? titleFromUrl(url) : "")

  const submit = () => {
    if (!valid || !title.trim() || sending) return
    withName(async (name) => {
      setSending(true)
      try {
        await suggestLink({
          linkylinkId: bundelId,
          url,
          title: title.trim().slice(0, 100),
          note: note.trim() || undefined,
          voterKey: getVisitor().key,
          name,
        })
        toast(`Sent to @${ownerName}`, { description: "It shows up here once they add it." })
        setRawUrl("")
        setTitleEdit(null)
        setNote("")
        onOpenChange(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't send your suggestion")
      } finally {
        setSending(false)
      }
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Suggest a link"
      description={`@${ownerName} decides whether to add it.`}
      initialFocusRef={urlRef}
      footer={
        <Button variant="tint" size="lg" onClick={submit} disabled={!valid || !title.trim() || sending}>
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          Send suggestion
        </Button>
      }
    >
      <div className="space-y-4 pt-2">
        <Input
          ref={urlRef}
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          value={rawUrl}
          onChange={(e) => setRawUrl(e.target.value)}
          placeholder="Paste a link"
          aria-label="Link"
          className="h-14 text-[17px]"
        />
        {valid && (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-tint-soft/60 p-3">
              <Favicon url={url} size={40} className="bg-surface" />
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-tint-ink">{domainOf(url)}</p>
            </div>
            <Field label="Title" htmlFor="suggest-title">
              <Input id="suggest-title" value={title} onChange={(e) => setTitleEdit(e.target.value)} maxLength={100} />
            </Field>
            <Field label="Why this one?" hint="Optional" htmlFor="suggest-note">
              <Textarea id="suggest-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 280))} rows={2} placeholder="It has a pool and it's an hour from the beach" />
            </Field>
          </>
        )}
      </div>
    </Sheet>
  )
}
