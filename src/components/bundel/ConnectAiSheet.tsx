"use client"

import { useMcpUrl } from "@/lib/use-mcp-url"
import { Copy, Sparkles } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { copyText } from "@/lib/share"
import { LINK_ACTIVITIES, activityPrompt } from "@/lib/mcp/activities"

export { useMcpUrl }

const STEPS = [
  {
    app: "Claude",
    steps: ["Settings → Connectors → Add custom connector.", "Paste the URL, then Connect and allow it on Bundel."],
  },
  {
    app: "ChatGPT",
    steps: ["Settings → Apps & Connectors → Create (developer mode).", "Paste the URL, choose OAuth, then allow it on Bundel."],
  },
]

export function ConnectInstructions({ url }: { url: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl bg-surface-2 p-2 pl-4">
        <code className="min-w-0 flex-1 truncate text-[13px]">{url}</code>
        <Button variant="primary" size="sm" onClick={() => copyText(url, "URL copied")}>
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
      {STEPS.map(({ app, steps }) => (
        <div key={app}>
          <p className="text-[15px] font-semibold">{app}</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[14px] text-ink-2">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

/** Owner sheet: connect an AI app to this one Bundel. */
export function ConnectAiSheet({ open, onOpenChange, bundelId, bundelTitle }: { open: boolean; onOpenChange: (open: boolean) => void; bundelId: string; bundelTitle: string }) {
  const url = useMcpUrl(`/mcp/b/${bundelId}`)
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Connect AI"
      description={`Let Claude or ChatGPT add links to “${bundelTitle}” and research them for you. It can't edit or delete anything.`}
    >
      <div className="space-y-6 pt-2">
        <ConnectInstructions url={url} />
        <div className="rounded-2xl bg-tint-soft/60 p-4 text-[14px] text-ink-2">
          <p className="font-semibold text-ink">Then just ask, for example:</p>
          <ul className="mt-1 space-y-0.5">
            <li>“Add this to my {bundelTitle} list”</li>
            <li>“Find deals for the first link”</li>
            <li>“Find places to stay near the venue”</li>
          </ul>
          <p className="mt-2">Results land under the link, visible only to you.</p>
          <a href="/docs#connect" target="_blank" rel="noopener" className="mt-2 inline-block font-semibold text-ink underline underline-offset-4">
            Step-by-step guide
          </a>
        </div>
      </div>
    </Sheet>
  )
}

/** In a link's edit sheet: copy a ready-made request for the user's AI app. */
export function ResearchWithAi({ linkTitle, bundelTitle, onConnect }: { linkTitle: string; bundelTitle: string; onConnect: () => void }) {
  return (
    <div className="space-y-2 border-t border-line/60 pt-4">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-ink-3">
        <Sparkles className="h-3.5 w-3.5" />
        Research with AI
      </p>
      <div className="flex flex-wrap gap-2">
        {LINK_ACTIVITIES.map((a) => (
          <Button
            key={a.key}
            variant="secondary"
            size="sm"
            onClick={() => copyText(activityPrompt(a, linkTitle, bundelTitle), "Copied. Paste it in Claude or ChatGPT.")}
          >
            {a.title}
          </Button>
        ))}
      </div>
      <p className="text-[13px] text-ink-3">
        Copies the request for your AI app. Not connected yet?{" "}
        <button type="button" onClick={onConnect} className="font-semibold text-ink underline-offset-4 hover:underline">
          Connect AI
        </button>
      </p>
    </div>
  )
}
