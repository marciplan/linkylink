"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Check, Loader2, Mail, Rss } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { followByEmail } from "@/lib/sharing-actions"
import { copyText } from "@/lib/share"

interface FollowSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  displayName: string
  emailEnabled: boolean
}

/** Follow a curator without an account: email (double opt-in) or RSS. */
export function FollowSheet({ open, onOpenChange, username, displayName, emailEnabled }: FollowSheetProps) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes("@") || state === "sending") return
    setState("sending")
    try {
      const res = await followByEmail({ username, email })
      setState("sent")
      if (res.status === "already") toast("You already get these updates")
    } catch (error) {
      setState("idle")
      toast.error(error instanceof Error ? error.message : "Couldn't sign you up")
    }
  }

  const feed = () => copyText(`${window.location.origin}/${username}/feed.xml`, "Feed link copied")

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Follow ${displayName}`} description="Hear about new links. No account, no spam, leave any time.">
      <div className="space-y-4 pt-2">
        {emailEnabled &&
          (state === "sent" ? (
            <div className="flex items-start gap-3 rounded-2xl bg-tint-soft p-4 text-tint-ink">
              <Check className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={3} />
              <p className="text-[15px]">Check your inbox and tap the link to confirm. Nothing is sent until you do.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <label htmlFor="follow-email" className="block px-1 text-[13px] font-semibold text-ink-2">
                Email me when there are new links
              </label>
              <div className="flex gap-2">
                <Input
                  id="follow-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Button type="submit" variant="tint" className="h-12 shrink-0" disabled={!email.includes("@") || state === "sending"}>
                  {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Follow
                </Button>
              </div>
              <p className="px-1 text-[13px] text-ink-3">At most one email a day, only when something is new.</p>
            </form>
          ))}
        <button
          onClick={feed}
          className="pressable flex w-full items-center gap-3 rounded-2xl bg-surface-2/70 p-4 text-left"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface text-ink-2">
            <Rss className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Copy RSS feed</span>
            <span className="block truncate text-[13px] text-ink-3">For Feedly, Reeder, NetNewsWire…</span>
          </span>
        </button>
      </div>
    </Sheet>
  )
}
