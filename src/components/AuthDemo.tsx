"use client"

import dynamic from "next/dynamic"
import { DesktopOnly } from "@/components/DesktopOnly"

const HomepageDemo = dynamic(() => import("@/components/HomepageDemo").then((m) => m.HomepageDemo), { ssr: false })

/** The landing page's example Bundel, for the desktop-only brand panel on sign-in and sign-up. */
export function AuthDemo() {
  return (
    <DesktopOnly>
      <HomepageDemo />
    </DesktopOnly>
  )
}
