"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, ChevronRight, Loader2, Plus, X } from "lucide-react"
import { Favicon } from "@/components/bundel/Favicon"
import { BundelIconTile } from "@/components/bundel/BundelHero"
import { useUnfurl } from "@/components/bundel/AddLinkSheet"
import { addLink } from "@/lib/actions"
import { bundelIcon } from "@/lib/bundel-icon"
import { domainOf } from "@/lib/links"
import { bundelGradient, bundelHue } from "@/lib/theme"

interface ShareTargetViewProps {
  url: string | null
  sharedTitle: string | null
  bundels: {
    id: string
    slug: string
    title: string
    avatar: string | null
    _count: { links: number }
    user: { username: string; image: string | null }
  }[]
}

export function ShareTargetView({ url, sharedTitle, bundels }: ShareTargetViewProps) {
  const router = useRouter()
  const { data, loading } = useUnfurl(url ?? "")
  const [savingTo, setSavingTo] = useState<string | null>(null)
  const [savedTo, setSavedTo] = useState<string | null>(null)

  const title = (data?.title || sharedTitle || (url ? domainOf(url) : "")).slice(0, 100)

  const save = async (bundel: ShareTargetViewProps["bundels"][number]) => {
    if (!url || savingTo) return
    setSavingTo(bundel.id)
    try {
      await addLink({ linkylinkId: bundel.id, title, url })
      setSavedTo(bundel.id)
      toast(`Added to ${bundel.title}`, {
        action: { label: "Open", onClick: () => router.push(`/${bundel.user.username}/${bundel.slug}`) },
      })
    } catch {
      toast.error("Couldn't add the link")
    } finally {
      setSavingTo(null)
    }
  }

  return (
    <div className="min-h-dvh bg-bg pb-safe">
      <header className="sticky top-0 z-10 pt-safe glass border-b border-line/60">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-3">
          <Link href="/dashboard" aria-label="Close" className="pressable grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-ink-2">
            <X className="h-5 w-5" />
          </Link>
          <p className="text-[15px] font-semibold">Add to Bundel</p>
          <span className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 pt-4">
        {url ? (
          <div className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line/50">
            <Favicon url={url} favicon={data?.favicon} size={48} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-semibold leading-snug">{title}</p>
              <p className="truncate text-[13px] text-ink-3">{data?.siteName || domainOf(url)}</p>
            </div>
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-3" />}
          </div>
        ) : (
          <p className="rounded-3xl bg-surface p-5 text-center text-ink-2 shadow-card">
            There&apos;s no link in what you shared. Try sharing the page itself.
          </p>
        )}

        {url && (
          <section className="space-y-2">
            <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Choose a Bundel</h2>
            <Link
              href={`/create?url=${encodeURIComponent(url)}`}
              className="pressable flex min-h-[64px] items-center gap-3 rounded-2xl bg-surface px-3 shadow-card ring-1 ring-line/50"
            >
              <span className="grid h-11 w-11 place-items-center rounded-[30%] bg-ink text-bg">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="flex-1 font-semibold">New Bundel</span>
              <ChevronRight className="h-4 w-4 text-ink-3" />
            </Link>
            <ul className="overflow-hidden rounded-2xl bg-surface shadow-card ring-1 ring-line/50 divide-y divide-line/70">
              {bundels.map((b) => {
                const hue = bundelHue(b.slug)
                return (
                  <li key={b.id}>
                    <button
                      onClick={() => save(b)}
                      disabled={!!savingTo || savedTo === b.id}
                      className="flex min-h-[64px] w-full items-center gap-3 px-3 text-left active:bg-ink/5"
                    >
                      <span className="rounded-[30%]" style={{ background: bundelGradient(hue) }}>
                        <BundelIconTile icon={bundelIcon(b.avatar, b.user.image, b.title)} size={44} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{b.title}</span>
                        <span className="block text-[13px] text-ink-3">{b._count.links} {b._count.links === 1 ? "link" : "links"}</span>
                      </span>
                      {savingTo === b.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-ink-3" />
                      ) : savedTo === b.id ? (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-tint-soft text-tint-ink"><Check className="h-4 w-4" strokeWidth={3} /></span>
                      ) : (
                        <Plus className="h-5 w-5 text-ink-3" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
