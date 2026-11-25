"use client"

import { Copy } from "lucide-react"
import { copyText } from "@/lib/share"
import { buttonStyles } from "@/components/ui/button"
import { useMcpUrl } from "@/lib/use-mcp-url"

/** Copies the Bundel connector URL for Claude or ChatGPT. */
export function CopyConnectorButton({ className }: { className?: string }) {
  const url = useMcpUrl("/mcp")
  return (
    <button type="button" onClick={() => copyText(url, "Connector URL copied. Paste it in Claude or ChatGPT.")} className={buttonStyles({ size: "md", className: `h-12 px-6 ${className ?? ""}` })}>
      <Copy className="h-4 w-4" />
      Copy the connector URL
    </button>
  )
}
