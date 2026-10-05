"use client"

import { Suspense, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { CalendarHeart, ClipboardPaste, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/field"
import { BundelIconTile } from "@/components/bundel/BundelHero"
import { Favicon } from "@/components/bundel/Favicon"
import { useUnfurl } from "@/components/bundel/AddLinkSheet"
import { addLinkToLinkylink, createLinkylink } from "@/lib/actions"
import { bundelGradient, bundelHue } from "@/lib/theme"
import { domainOf, findUrl } from "@/lib/links"
import { generateSlug } from "@/lib/utils"
import { useCanPaste } from "@/lib/use-can-paste"

function CreateBundel() {
  const router = useRouter()
  const params = useSearchParams()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [rawUrl, setRawUrl] = useState(() => findUrl(params.get("url")) ?? "")
  const [creating, setCreating] = useState(false)
  const canPaste = useCanPaste()
  const nameRef = useRef<HTMLTextAreaElement>(null)
  const { url, valid, data, loading } = useUnfurl(rawUrl)

  // Preview colour matches the page that will be created (it is keyed on the slug).
  const hue = bundelHue(generateSlug(name) || "new-bundel")

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const found = findUrl(text)
      if (found) setRawUrl(found)
      else toast("No link on your clipboard")
    } catch {
      // Permission denied — the field is still there to paste into manually.
    }
  }

  const create = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const title = name.trim()
    if (!title || creating) {
      nameRef.current?.focus()
      return
    }
    setCreating(true)
    try {
      const bundel = await createLinkylink({ title: title.slice(0, 100), subtitle: description.trim() || undefined })
      if (valid) {
        await addLinkToLinkylink(bundel.id, { title: (data?.title || domainOf(url)).slice(0, 100), url, order: 0 })
      }
      router.push(`/${bundel.user.username}/${bundel.slug}`)
    } catch {
      toast.error("Couldn't create your Bundel. Try again?")
      setCreating(false)
    }
  }

  return (
    <div data-tint style={{ "--tint-h": hue } as React.CSSProperties} className="flex min-h-dvh flex-col bg-bg">
      {/* Sheets render in a portal outside this element, so set the hue page-wide too. */}
      <style>{`:root{--tint-h:${hue}}`}</style>
      <header className="sticky top-0 z-10 pt-safe">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-3">
          <Link href="/dashboard" aria-label="Cancel" className="pressable grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-ink-2">
            <X className="h-5 w-5" />
          </Link>
          <p className="text-[15px] font-semibold">New Bundel</p>
          <span className="w-10" />
        </div>
      </header>

      <form onSubmit={create} className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-safe">
        {/* Live preview of the header */}
        <div
          className="relative mt-2 overflow-hidden rounded-4xl p-5 text-white shadow-float transition-[background] duration-500"
          style={{ background: bundelGradient(hue) }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/40" />
          <div className="relative">
            <BundelIconTile icon={{ kind: "emoji", value: "✨" }} size={52} />
            <textarea
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\n/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), create())}
              rows={1}
              maxLength={100}
              autoFocus
              enterKeyHint="next"
              aria-label="Name"
              placeholder="Name your Bundel"
              className="mt-4 block w-full resize-none bg-transparent text-[28px] font-bold leading-tight tracking-tight outline-none placeholder:text-white/60 [field-sizing:content] [text-shadow:0_1px_12px_rgb(0_0_0/0.2)]"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              rows={1}
              aria-label="Description"
              placeholder="Add a description (optional)"
              className="mt-1 !min-h-0 !rounded-none !border-0 !bg-transparent !p-0 text-[16px] text-white/90 !ring-0 placeholder:text-white/60 [field-sizing:content]"
            />
            <p className="mt-4 text-xs font-medium text-white/70">An icon is picked for you. Change it any time.</p>
          </div>
        </div>

        <section className="mt-6 space-y-2">
          <h2 className="px-1 text-[13px] font-semibold text-ink-2">Start with a link <span className="font-normal text-ink-3">(optional)</span></h2>
          <div className="relative">
            <Input
              type="url"
              inputMode="url"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
              value={rawUrl}
              onChange={(e) => setRawUrl(e.target.value)}
              placeholder="Paste a link"
              aria-label="First link"
              className="h-14 pr-28"
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
            <div className="flex animate-rise items-center gap-3 rounded-2xl bg-surface p-3 shadow-card ring-1 ring-line/50">
              <Favicon url={url} favicon={data?.favicon} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{data?.title || domainOf(url)}</p>
                <p className="truncate text-[13px] text-ink-3">{data?.siteName || domainOf(url)}</p>
              </div>
              {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-3" />}
            </div>
          )}
        </section>

        <div className="flex-1" />

        <div className="sticky bottom-0 space-y-3 bg-gradient-to-t from-bg via-bg to-bg/0 pb-3 pt-6">
          <Button type="submit" variant="primary" size="lg" disabled={!name.trim() || creating}>
            {creating && <Loader2 className="h-5 w-5 animate-spin" />}
            {creating ? "Creating…" : "Create Bundel"}
          </Button>
          <Link
            href="/create/year-review"
            className="pressable flex items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold text-ink-2"
          >
            <CalendarHeart className="h-4 w-4" />
            Making a year in review instead?
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense>
      <CreateBundel />
    </Suspense>
  )
}
