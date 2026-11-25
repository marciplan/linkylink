"use client"

import { useState, FormEvent } from "react"
import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import { BundelMark } from "@/components/BundelLogo"
import { cn } from "@/lib/utils"

/**
 * The last row of the FAQ: type your own question, answered by AI from what
 * the site says (see /api/ask). Earlier answers stay above the field.
 */
export function AskRow() {
  const [question, setQuestion] = useState("")
  const [thread, setThread] = useState<{ q: string; a?: string; error?: boolean }[]>([])
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const text = question.trim()
    if (text.length < 3 || loading) return
    setThread((t) => [...t, { q: text }])
    setQuestion("")
    setLoading(true)
    let entry: { a: string; error?: boolean }
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text }) })
      const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string }
      entry = res.ok && data.answer ? { a: data.answer } : { a: data.error || "Something went wrong. Try again in a moment.", error: true }
    } catch {
      entry = { a: "Something went wrong. Try again in a moment.", error: true }
    }
    setThread((t) => t.map((item, i) => (i === t.length - 1 ? { ...item, ...entry } : item)))
    setLoading(false)
  }

  return (
    <div className="px-5 py-4 md:px-7">
      <p className="flex items-center gap-2 text-[16px] font-semibold">
        <Sparkles className="h-4 w-4" />
        Ask your own question
      </p>

      {thread.length > 0 && (
        <div className="mt-4 space-y-3" aria-live="polite">
          {thread.map((item, i) => (
            <div key={i} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[15px] text-bg">{item.q}</p>
              <div className="flex items-start gap-2.5">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2">
                  <BundelMark className="h-4" />
                </span>
                <div className={cn("max-w-[85%] rounded-3xl rounded-tl-lg bg-surface-2 px-4 py-2.5 text-[15px] leading-relaxed text-pretty", item.error && "text-danger")}>
                  {item.a ?? (
                    <span className="inline-flex items-center gap-2 text-ink-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-full bg-surface-2 p-1.5 pl-5 ring-1 ring-line/60 focus-within:ring-ink/30">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, 400))}
          placeholder="Can I use Bundel for…"
          aria-label="Your question about Bundel"
          className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-3"
        />
        <button
          type="submit"
          disabled={loading || question.trim().length < 3}
          aria-label="Ask"
          className="pressable grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-bg disabled:opacity-30"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" strokeWidth={2.5} />}
        </button>
      </form>
      <p className="mt-2 px-1 text-[13px] text-ink-3">Answered by AI, using only what&apos;s on this site.</p>
    </div>
  )
}
