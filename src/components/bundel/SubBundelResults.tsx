"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, X } from "lucide-react"
import { toast } from "sonner"
import { Favicon } from "./Favicon"
import { deleteLink } from "@/lib/actions"
import { addBlockedSite } from "@/lib/ai-actions"
import { findActivity } from "@/lib/mcp/activities"
import { domainOf } from "@/lib/links"
import { cn } from "@/lib/utils"

export interface SubBundelResult {
  id: string
  title: string
  url: string
  context: string | null
  favicon: string | null
}

export interface SubBundelSummary {
  id: string
  title: string
  path: string
  activity: string
  sourceLinkId: string | null
  links: SubBundelResult[]
}

const PREVIEW = 3

function chipLabel(sub: SubBundelSummary, count: number) {
  const activity = findActivity(sub.activity)
  if (!activity) return `${count} ${count === 1 ? "result" : "results"}`
  return `${count} ${count === 1 ? activity.noun.one : activity.noun.many}`
}

/**
 * What an AI activity found for a link, inside the link's card: a chip that
 * opens the first few results in place, each removable, and a way to the full
 * sub-Bundel. Owner view only.
 */
export function SubBundelResults({ subs, indent = true }: { subs: SubBundelSummary[]; /** Line up under the link's title. */ indent?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [results, setResults] = useState(() => Object.fromEntries(subs.map((s) => [s.id, s.links])))
  const [confirming, setConfirming] = useState<string | null>(null)

  const remove = async (subId: string, result: SubBundelResult, block: boolean) => {
    setConfirming(null)
    setResults((all) => ({ ...all, [subId]: all[subId].filter((r) => r.id !== result.id) }))
    try {
      await deleteLink(result.id)
      if (block) {
        const site = await addBlockedSite(result.url)
        toast(`Removed. Results from ${site.domain} won't be saved again.`)
      } else {
        toast("Result removed")
      }
    } catch {
      setResults((all) => ({ ...all, [subId]: [...all[subId], result] }))
      toast.error("Couldn't remove that result")
    }
  }

  const visible = subs.filter((s) => (results[s.id]?.length ?? 0) > 0)
  if (visible.length === 0) return null
  const open = visible.find((s) => s.id === openId)

  return (
    <div className={cn("px-4 pb-4", indent && "pl-[74px]")}>
      <div className="flex flex-wrap gap-2">
        {visible.map((sub) => {
          const isOpen = sub.id === openId
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setOpenId(isOpen ? null : sub.id)}
              aria-expanded={isOpen}
              className={cn(
                "pressable inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ring-1",
                isOpen ? "bg-tint-soft text-tint-ink ring-tint/40" : "bg-tint-soft/60 text-tint-ink ring-tint/25"
              )}
            >
              {chipLabel(sub, results[sub.id].length)}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} strokeWidth={2.5} />
            </button>
          )
        })}
      </div>

      {open && (
        <div className="mt-3">
          <ul className="space-y-1 border-l-2 border-line pl-3">
            {results[open.id].slice(0, PREVIEW).map((r) => (
              <li key={r.id} className="relative">
                {confirming === r.id ? (
                  <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-surface-2 p-2">
                    <button type="button" onClick={() => remove(open.id, r, false)} className="pressable h-8 rounded-full bg-surface px-3 text-[13px] font-semibold shadow-card">
                      Remove
                    </button>
                    <button type="button" onClick={() => remove(open.id, r, true)} className="pressable h-8 rounded-full bg-surface px-3 text-[13px] font-semibold text-danger shadow-card">
                      Never show {domainOf(r.url)}
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} className="pressable h-8 rounded-full px-3 text-[13px] font-semibold text-ink-2">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-2xl py-1.5 pr-10">
                    <Favicon url={r.url} favicon={r.favicon} size={28} className="mt-0.5 rounded-[9px]" />
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:underline">
                      <span className="block truncate text-[14.5px] font-semibold leading-snug">{r.title}</span>
                      <span className="block text-[13px] leading-snug text-ink-3 text-pretty">{r.context || domainOf(r.url)}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirming(r.id)}
                      aria-label={`Remove ${r.title}`}
                      className="pressable absolute right-0 top-1 grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between pl-3 text-[13px]">
            <span className="text-ink-3">
              {results[open.id].length > PREVIEW ? `${results[open.id].length - PREVIEW} more` : " "}
            </span>
            <Link href={open.path} className="font-semibold text-ink hover:underline">
              Open as Bundel
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
