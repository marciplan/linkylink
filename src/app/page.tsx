import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ArrowRight, ClipboardPaste, Link2, Palette, Share } from "lucide-react"
import { HomepageDemo } from "@/components/HomepageDemo"
import { buttonStyles } from "@/components/ui/button"

const steps = [
  { icon: ClipboardPaste, title: "Paste links", body: "Drop in a URL. The title and icon fill themselves in." },
  { icon: Palette, title: "Looks good by default", body: "Every Bundel gets its own colours. No design work." },
  { icon: Share, title: "Send one link", body: "One page instead of five messages. Opens fast on any phone." },
]

export default async function HomePage() {
  const session = await auth()

  if (session?.user?.id) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-bg">
      <header className="pt-safe">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <span className="inline-flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-bg">
              <Link2 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Bundel
          </span>
          <Link href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 pb-16 pt-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div className="animate-rise text-center md:text-left">
            <h1 className="text-[clamp(2.5rem,1.6rem+4.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.04em] text-balance">
              All your links, one&nbsp;place.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-[18px] leading-relaxed text-ink-2 text-pretty md:mx-0">
              Stop sending five links in a row. Make one page that looks good and opens fast on any phone.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start sm:justify-center">
              <Link href="/register" className={buttonStyles({ size: "md", className: "h-14 w-full px-7 text-base sm:w-auto" })}>
                Make a Bundel
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="text-sm text-ink-3">Free. Takes about a minute.</span>
            </div>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <HomepageDemo />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-20">
          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line/50">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-2 text-ink">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-ink-3">0{i + 1}</span>
                </span>
                <h2 className="mt-4 text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-[15px] text-ink-2 text-pretty">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-line/70 pb-safe">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 text-sm text-ink-3">
          <span>© {new Date().getFullYear()} Bundel</span>
          <nav className="flex gap-5">
            <Link href="/about" className="hover:text-ink">About</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
