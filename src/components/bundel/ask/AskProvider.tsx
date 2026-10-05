"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { castVote, myVotes } from "@/lib/sharing-actions"
import { getVisitor, saveVisitor } from "@/lib/visitor"
import type { VoteSummary } from "@/lib/sharing"

export interface AskSettings {
  kind: "PICK_ONE" | "PICK_ANY"
  question: string | null
  allowSuggestions: boolean
  closed: boolean
}

interface AskContextValue {
  bundelId: string
  ask: AskSettings
  summary: VoteSummary
  mine: string[]
  ownerName: string
  /** Signed-in username, or null for anonymous visitors. */
  signedInAs: string | null
  readOnly: boolean
  vote: (linkId: string) => void
  /** Resolve the visitor's display name, asking for it once if needed. */
  withName: (then: (name: string) => void) => void
}

const AskContext = createContext<AskContextValue | null>(null)

export function useAsk() {
  const ctx = useContext(AskContext)
  if (!ctx) throw new Error("useAsk must be used inside AskProvider")
  return ctx
}

export function defaultQuestion(kind: AskSettings["kind"]) {
  return kind === "PICK_ONE" ? "Which one should we pick?" : "Which ones are you in for?"
}

export function totalVotes(summary: VoteSummary) {
  return Object.values(summary).reduce((n, v) => n + v.count, 0)
}

interface AskProviderProps {
  bundelId: string
  ask: AskSettings
  initialSummary: VoteSummary
  ownerName: string
  signedInAs: string | null
  readOnly?: boolean
  children: React.ReactNode
}

export function AskProvider({ bundelId, ask, initialSummary, ownerName, signedInAs, readOnly = false, children }: AskProviderProps) {
  const [summary, setSummary] = useState(initialSummary)
  const [mine, setMine] = useState<string[]>([])
  const [askingName, setAskingName] = useState(false)
  const [draftName, setDraftName] = useState("")
  const pending = useRef<((name: string) => void) | null>(null)
  const busy = useRef(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // Server props can change after an owner edit; keep counts in sync.
  const [seen, setSeen] = useState(initialSummary)
  if (seen !== initialSummary) {
    setSeen(initialSummary)
    setSummary(initialSummary)
  }

  useEffect(() => {
    let alive = true
    myVotes(bundelId, getVisitor().key)
      .then((ids) => alive && setMine(ids))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [bundelId])

  const withName = useCallback(
    (then: (name: string) => void) => {
      if (signedInAs) return then(signedInAs)
      const visitor = getVisitor()
      if (visitor.name) return then(visitor.name)
      pending.current = then
      setAskingName(true)
    },
    [signedInAs]
  )

  const vote = useCallback(
    (linkId: string) => {
      if (readOnly || ask.closed || busy.current) return
      withName(async (name) => {
        busy.current = true
        const before = { summary, mine }
        // Optimistic toggle so the tap feels instant.
        const had = mine.includes(linkId)
        const nextMine = had ? mine.filter((id) => id !== linkId) : ask.kind === "PICK_ONE" ? [linkId] : [...mine, linkId]
        const next: VoteSummary = structuredClone(summary)
        for (const id of mine) if (!nextMine.includes(id) && next[id]) next[id] = { count: next[id].count - 1, names: next[id].names.filter((n) => n !== name) }
        if (!had) next[linkId] = { count: (next[linkId]?.count ?? 0) + 1, names: [...(next[linkId]?.names ?? []), name] }
        setMine(nextMine)
        setSummary(next)
        if (!had && navigator.vibrate) navigator.vibrate(8)
        try {
          const res = await castVote({ linkylinkId: bundelId, linkId, voterKey: getVisitor().key, voterName: name })
          setSummary(res.summary)
          setMine(res.mine)
        } catch (error) {
          setSummary(before.summary)
          setMine(before.mine)
          toast.error(error instanceof Error ? error.message : "Couldn't save your vote")
        } finally {
          busy.current = false
        }
      })
    },
    [readOnly, ask.closed, ask.kind, withName, summary, mine, bundelId]
  )

  const submitName = (e: React.FormEvent) => {
    e.preventDefault()
    const name = draftName.trim().slice(0, 40)
    if (!name) return
    saveVisitor({ ...getVisitor(), name })
    setAskingName(false)
    const then = pending.current
    pending.current = null
    then?.(name)
  }

  return (
    <AskContext.Provider value={{ bundelId, ask, summary, mine, ownerName, signedInAs, readOnly, vote, withName }}>
      {children}
      <Sheet
        open={askingName}
        onOpenChange={(open) => {
          setAskingName(open)
          if (!open) pending.current = null
        }}
        title="What's your name?"
        description={`So @${ownerName} knows who picked what. No account needed.`}
        initialFocusRef={nameRef}
        footer={
          <Button variant="tint" size="lg" type="submit" form="visitor-name" disabled={!draftName.trim()}>
            Continue
          </Button>
        }
      >
        <form id="visitor-name" onSubmit={submitName} className="pt-2">
          <Input
            ref={nameRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={40}
            autoComplete="given-name"
            enterKeyHint="done"
            placeholder="Your first name"
            aria-label="Your name"
          />
          <p className="mt-2 px-1 text-[13px] text-ink-3">Saved on this device for next time.</p>
        </form>
      </Sheet>
    </AskContext.Provider>
  )
}
