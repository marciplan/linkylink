import Link from "next/link"
import { Link2 } from "lucide-react"
import { AuthDemo } from "@/components/AuthDemo"

/** Shared frame for sign-in and sign-up: brand mark, heading, form, footer link. */
export function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex min-h-dvh flex-col">
      <header className="pt-safe">
        <div className="mx-auto flex h-14 max-w-sm items-center px-4 lg:h-20 lg:max-w-md lg:px-0">
          <Link href="/" className="pressable inline-flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-bg">
              <Link2 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Bundel
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 pb-16 lg:max-w-md lg:px-0">
        <div className="animate-rise">
          <h1 className="text-display">{title}</h1>
          <p className="mt-2 text-[17px] text-ink-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-[15px] text-ink-2">{footer}</p>
        </div>
      </main>
      </div>

      {/* Desktop only: a brand panel with a live example, so the form isn't alone on a wide screen. */}
      <aside
        className="tone-hero grain relative hidden items-center justify-center overflow-hidden text-white lg:flex"
        style={{ "--t-h": 265, "--t-s": 0.05, "--t-c": 0.09 } as React.CSSProperties}
      >
        <div className="mx-auto w-full max-w-sm px-8 py-16 text-center">
          <p className="text-display text-balance">All your links, one place.</p>
          <p className="mx-auto mt-3 max-w-xs text-[17px] text-white/75 text-pretty">One page instead of five messages. It opens fast on any phone.</p>
          <div className="mt-12">
            <AuthDemo />
          </div>
        </div>
      </aside>
    </div>
  )
}

/** Only allow same-site relative redirects. */
export function safeCallback(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback
}
