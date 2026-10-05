import Link from "next/link"
import { Link2 } from "lucide-react"

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
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="pt-safe">
        <div className="mx-auto flex h-14 max-w-sm items-center px-4">
          <Link href="/" className="pressable inline-flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-bg">
              <Link2 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Bundel
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 pb-16">
        <div className="animate-rise">
          <h1 className="text-display">{title}</h1>
          <p className="mt-2 text-[17px] text-ink-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-[15px] text-ink-2">{footer}</p>
        </div>
      </main>
    </div>
  )
}

/** Only allow same-site relative redirects. */
export function safeCallback(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback
}
