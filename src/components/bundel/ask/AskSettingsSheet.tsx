"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/sheet"
import { Input } from "@/components/ui/field"
import { updateAsk } from "@/lib/sharing-actions"
import { cn } from "@/lib/utils"
import { defaultQuestion, type AskSettings } from "./AskProvider"

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {hint && <span className="block text-[13px] text-ink-3">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-tint",
          checked ? "bg-tint-strong" : "bg-ink/15"
        )}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </span>
    </label>
  )
}

interface AskSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundelId: string
  ask: AskSettings | null
  onChange: (ask: AskSettings | null) => void
}

/** Turn a Bundel into a question friends can vote on. Every change saves immediately. */
export function AskSettingsSheet({ open, onOpenChange, bundelId, ask, onChange }: AskSettingsSheetProps) {
  const [question, setQuestion] = useState(ask?.question ?? "")

  const save = async (next: AskSettings | null) => {
    const before = ask
    onChange(next)
    try {
      await updateAsk(bundelId, next ? { enabled: true, ...next } : { enabled: false })
    } catch {
      onChange(before)
      toast.error("Couldn't save that change")
    }
  }

  const base: AskSettings = ask ?? { kind: "PICK_ONE", question: null, allowSuggestions: true, closed: false }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && ask && (question.trim() || null) !== ask.question) save({ ...ask, question: question.trim() || null })
        onOpenChange(o)
      }}
      title="Ask for votes"
      description="Friends vote on your links without an account. You see who picked what."
    >
      <div className="space-y-4 pt-2">
        <div className="overflow-hidden rounded-2xl bg-surface-2/70">
          <Switch
            checked={!!ask}
            onChange={(on) => save(on ? { ...base, question: question.trim() || null } : null)}
            label="Ask mode"
            hint={ask ? "Visitors see a Vote button on each link" : "Off: this Bundel is a plain list"}
          />
        </div>

        {ask && (
          <>
            <div role="radiogroup" aria-label="Voting style" className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
              {(["PICK_ONE", "PICK_ANY"] as const).map((kind) => (
                <button
                  key={kind}
                  role="radio"
                  aria-checked={ask.kind === kind}
                  onClick={() => save({ ...ask, kind })}
                  className={cn(
                    "pressable h-11 rounded-xl text-sm font-semibold",
                    ask.kind === kind ? "bg-surface text-ink shadow-card" : "text-ink-2"
                  )}
                >
                  {kind === "PICK_ONE" ? "Pick one" : "Pick any"}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ask-question" className="block px-1 text-[13px] font-semibold text-ink-2">
                Your question
              </label>
              <Input
                id="ask-question"
                value={question}
                maxLength={120}
                onChange={(e) => setQuestion(e.target.value)}
                onBlur={() => (question.trim() || null) !== ask.question && save({ ...ask, question: question.trim() || null })}
                placeholder={defaultQuestion(ask.kind)}
              />
            </div>

            <div className="divide-y divide-line/70 overflow-hidden rounded-2xl bg-surface-2/70">
              <Switch
                checked={ask.allowSuggestions}
                onChange={(allowSuggestions) => save({ ...ask, allowSuggestions })}
                label="Let people suggest links"
                hint="Suggestions wait for you to add them"
              />
              <Switch
                checked={ask.closed}
                onChange={(closed) => save({ ...ask, closed })}
                label="Close voting"
                hint="Shows the result and stops new votes"
              />
            </div>
          </>
        )}
      </div>
    </Sheet>
  )
}
