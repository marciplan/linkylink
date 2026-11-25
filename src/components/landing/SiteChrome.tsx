import Link from "next/link"
import { BundelLogo } from "@/components/BundelLogo"
import { buttonStyles } from "@/components/ui/button"

/** Header for the public marketing pages (home, moments). */
export function SiteHeader({ cta = "/register" }: { cta?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line/40 bg-bg/75 pt-safe backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <span className="flex items-center gap-7">
          <Link href="/" className="pressable" aria-label="Bundel home">
            <BundelLogo className="text-[17px]" />
          </Link>
          <nav className="hidden items-center gap-6 text-[15px] font-medium md:flex">
            <Link href="/showcase" className="hover:text-ink-2">Showcase</Link>
            <Link href="/#ai" className="hover:text-ink-2">With AI</Link>
            <Link href="/#moments" className="hover:text-ink-2">Moments</Link>
            <Link href="/#faq" className="hover:text-ink-2">FAQ</Link>
            <Link href="/docs" className="hover:text-ink-2">Guide</Link>
          </nav>
        </span>
        <span className="flex items-center gap-1">
          <Link href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
          <Link href={cta} className={buttonStyles({ size: "sm", className: "hidden sm:inline-flex" })}>
            Make a Bundel
          </Link>
        </span>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 pb-safe">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-ink-3 md:px-8">
        <span>© {new Date().getFullYear()} Bundel</span>
        <nav className="flex flex-wrap gap-5">
          <Link href="/showcase" className="hover:text-ink">Showcase</Link>
          <Link href="/moments/black-friday" className="hover:text-ink">Black Friday</Link>
          <Link href="/moments/trip-planning" className="hover:text-ink">Trips</Link>
          <Link href="/docs" className="hover:text-ink">Guide</Link>
          <Link href="/about" className="hover:text-ink">About</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        </nav>
      </div>
    </footer>
  )
}
