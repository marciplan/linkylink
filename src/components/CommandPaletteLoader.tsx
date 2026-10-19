"use client"

import dynamic from "next/dynamic"
import { DesktopOnly } from "@/components/DesktopOnly"

const CommandPalette = dynamic(() => import("@/components/CommandPalette"), { ssr: false })

/** Loads the palette (and its shortcuts) only on desktop-width screens. */
export function CommandPaletteLoader({ username }: { username: string }) {
  return (
    <DesktopOnly>
      <CommandPalette username={username} />
    </DesktopOnly>
  )
}
