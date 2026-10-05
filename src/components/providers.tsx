"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { ThemeProvider } from "./theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        defaultTheme="system"
        storageKey="linkylink-theme"
      >
        {children}
        <Toaster
          position="bottom-center"
          offset={96}
          mobileOffset={{ bottom: 96 }}
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !bg-ink !text-bg !border-0 !shadow-float !font-sans",
              actionButton: "!bg-bg/15 !text-bg !rounded-full !font-semibold",
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  )
}
