"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Check, Loader2, Palette, RefreshCw } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { FluentEmoji } from "@/components/FluentEmoji"
import { bundelGradient } from "@/lib/theme"
import { cn } from "@/lib/utils"

interface AppearanceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundel: { id: string; title: string; subtitle: string | null; headerImages?: string[] }
  hue: number
  icon: string
  headerImage: string | null
  /** Persist immediately — each choice is applied as it is tapped. */
  onIconChange: (emoji: string) => void
  onHeaderChange: (image: string | null) => void
}

const FALLBACK_EMOJIS = ["📝", "💼", "🌟", "🎯", "🚀", "💡", "🎨", "📊"]

export function AppearanceSheet({ open, onOpenChange, bundel, hue, icon, headerImage, onIconChange, onHeaderChange }: AppearanceSheetProps) {
  const [emojis, setEmojis] = useState<string[]>([])
  const [loadingEmojis, setLoadingEmojis] = useState(false)
  const [images, setImages] = useState<string[]>(bundel.headerImages ?? [])
  const [generating, setGenerating] = useState(false)
  const [custom, setCustom] = useState("")

  const fetchEmojis = async (): Promise<string[]> => {
    try {
      const res = await fetch("/api/suggest-emojis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bundel.title, subtitle: bundel.subtitle }),
      })
      const data = res.ok ? await res.json() : null
      return data?.emojis?.length ? data.emojis : FALLBACK_EMOJIS
    } catch {
      return FALLBACK_EMOJIS
    }
  }

  const loadEmojis = async () => {
    setLoadingEmojis(true)
    setEmojis(await fetchEmojis())
    setLoadingEmojis(false)
  }

  useEffect(() => {
    if (!open || emojis.length > 0) return
    let alive = true
    fetchEmojis().then((list) => alive && setEmojis(list))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/generate-header", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkylinkId: bundel.id, title: bundel.title, subtitle: bundel.subtitle, selectedEmoji: icon }),
      })
      if (res.ok) {
        const data = await res.json()
        setImages(data.images ?? [])
        // The endpoint selects its first result; mirror that locally.
        if (data.selectedImage) onHeaderChange(data.selectedImage)
      }
    } finally {
      setGenerating(false)
    }
  }

  const options = Array.from(new Set([...(emojis.slice(0, 7)), ...(icon && !emojis.includes(icon) ? [icon] : [])]))

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Appearance" description="Changes apply right away.">
      <div className="space-y-7 pt-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">Icon</h3>
            <button onClick={loadEmojis} disabled={loadingEmojis} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2">
              {loadingEmojis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              More ideas
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {options.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onIconChange(emoji)}
                aria-pressed={icon === emoji}
                className={cn(
                  "pressable grid aspect-square place-items-center rounded-2xl",
                  icon === emoji ? "bg-tint-soft ring-2 ring-tint" : "bg-surface-2"
                )}
                aria-label={`Use ${emoji}`}
              >
                <FluentEmoji emoji={emoji} size={40} />
              </button>
            ))}
            <input
              value={custom}
              onChange={(e) => {
                const value = e.target.value
                const emoji = value.match(/\p{Extended_Pictographic}(‍\p{Extended_Pictographic}|️)*/u)?.[0]
                setCustom(emoji ?? "")
                if (emoji) onIconChange(emoji)
              }}
              aria-label="Use your own emoji"
              placeholder="＋"
              className="aspect-square w-full rounded-2xl bg-surface-2 text-center text-3xl outline-none placeholder:text-xl placeholder:text-ink-3 focus:ring-2 focus:ring-tint"
            />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">Background</h3>
            <button onClick={generate} disabled={generating} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {images.length ? "New set" : "Generate"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onHeaderChange(null)}
              aria-pressed={!headerImage}
              className={cn("pressable relative aspect-[16/9] overflow-hidden rounded-2xl", !headerImage && "ring-2 ring-tint ring-offset-2 ring-offset-surface")}
              style={{ background: bundelGradient(hue) }}
            >
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
                <Palette className="h-3 w-3" /> Auto
              </span>
              {!headerImage && <Selected />}
            </button>
            {images.slice(0, 5).map((src, i) => (
              <button
                key={src.slice(-40) + i}
                onClick={() => onHeaderChange(src)}
                aria-pressed={headerImage === src}
                aria-label={`Background ${i + 1}`}
                className={cn(
                  "pressable relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface-2",
                  headerImage === src && "ring-2 ring-tint ring-offset-2 ring-offset-surface"
                )}
              >
                <Image src={src} alt="" fill sizes="50vw" className="object-cover" unoptimized />
                {headerImage === src && <Selected />}
              </button>
            ))}
          </div>
          {images.length === 0 && (
            <Button variant="secondary" size="md" className="mt-3 w-full" onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
              Generate backgrounds from your icon
            </Button>
          )}
        </section>
      </div>
    </Sheet>
  )
}

function Selected() {
  return (
    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-ink shadow">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  )
}
