"use client"

import { useState, FormEvent } from "react"
import { Plus, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { ConnectInstructions, useMcpUrl } from "@/components/bundel/ConnectAiSheet"
import { addBlockedSite, removeBlockedSite, revokeAiApp } from "@/lib/ai-actions"

export interface ConnectedApp {
  id: string
  name: string
  bundelTitle: string | null
  lastUsedAt: string | null
  createdAt: string
}

const timeAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString()
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">{children}</h2>
}

export function AiSettings({ apps: initialApps, sites: initialSites }: { apps: ConnectedApp[]; sites: { id: string; domain: string }[] }) {
  const [apps, setApps] = useState(initialApps)
  const [sites, setSites] = useState(initialSites)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const accountUrl = useMcpUrl("/mcp")

  const revoke = async (id: string) => {
    const before = apps
    setApps((list) => list.filter((a) => a.id !== id))
    try {
      await revokeAiApp(id)
      toast("Disconnected")
    } catch {
      setApps(before)
      toast.error("Couldn't disconnect that app")
    }
  }

  const addSite = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    setSaving(true)
    try {
      const site = await addBlockedSite(draft)
      setSites((list) => (list.some((s) => s.id === site.id) ? list : [...list, site]))
      setDraft("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add that site")
    } finally {
      setSaving(false)
    }
  }

  const removeSite = async (id: string) => {
    const before = sites
    setSites((list) => list.filter((s) => s.id !== id))
    try {
      await removeBlockedSite(id)
    } catch {
      setSites(before)
      toast.error("Couldn't remove that site")
    }
  }

  return (
    <>
      <section>
        <SectionTitle>Connected AI apps</SectionTitle>
        <div className="overflow-hidden rounded-3xl bg-surface shadow-card">
          {apps.length === 0 ? (
            <p className="px-4 py-4 text-[14px] text-ink-2 text-pretty">
              Connect Claude or ChatGPT to add links by chatting and let it research deals and places to stay for you.
            </p>
          ) : (
            <ul className="divide-y divide-line/70">
              {apps.map((app) => (
                <li key={app.id} className="flex min-h-[60px] items-center gap-3 px-4 py-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint-soft text-tint-ink">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{app.name}</p>
                    <p className="truncate text-[13px] text-ink-3">
                      {app.bundelTitle ? `Only “${app.bundelTitle}”` : "Whole account"} · {app.lastUsedAt ? `used ${timeAgo(app.lastUsedAt)}` : `added ${timeAgo(app.createdAt)}`}
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => revoke(app.id)}>
                    Disconnect
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="flex min-h-[52px] w-full items-center gap-3 border-t border-line/70 px-4 text-left text-[15px] font-medium active:bg-ink/5"
          >
            <Plus className="h-5 w-5 text-ink-2" />
            Connect an AI app to your whole account
          </button>
        </div>
      </section>

      <section>
        <SectionTitle>Sites to skip</SectionTitle>
        <div className="rounded-3xl bg-surface p-4 shadow-card">
          <p className="text-[14px] text-ink-2 text-pretty">AI research never saves results from these sites. Links you add yourself still go in.</p>
          <form onSubmit={addSite} className="mt-3 flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="amazon.com"
              aria-label="Website to skip"
              inputMode="url"
              autoCapitalize="off"
              spellCheck={false}
              disabled={saving}
            />
            <Button type="submit" variant="primary" disabled={saving || !draft.trim()}>
              Add
            </Button>
          </form>
          {sites.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {sites.map((site) => (
                <li key={site.id} className="inline-flex h-8 items-center gap-1 rounded-full bg-surface-2 pl-3 pr-1 text-[13px] font-semibold">
                  {site.domain}
                  <button
                    type="button"
                    onClick={() => removeSite(site.id)}
                    aria-label={`Stop skipping ${site.domain}`}
                    className="pressable grid h-6 w-6 place-items-center rounded-full text-ink-3 hover:bg-ink/10 hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Sheet
        open={connectOpen}
        onOpenChange={setConnectOpen}
        title="Connect AI"
        description="Gives the app all your Bundels: it can add links, make new Bundels and research links. It can't edit or delete anything. To share just one Bundel, use Connect AI in that Bundel's menu."
      >
        <div className="pt-2">
          <ConnectInstructions url={accountUrl} />
        </div>
      </Sheet>
    </>
  )
}
