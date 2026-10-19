import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ArrowRight, ClipboardPaste, Link2, Palette, Share } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { HomepageDemo } from "@/components/HomepageDemo"
import { emojiTone } from "@/lib/emoji-tone"
import { toneProps } from "@/lib/tone"
import { buttonStyles } from "@/components/ui/button"

const steps = [
  { icon: ClipboardPaste, title: "Paste links", body: "Drop in a URL. The title and icon fill themselves in." },
  { icon: Palette, title: "Looks good by default", body: "Every Bundel gets its own colours. No design work." },
  { icon: Share, title: "Send one link", body: "One page instead of five messages. Opens fast on any phone." },
]

const formats = [
  { emoji: "🗳️", title: "Ask", body: "Can't decide? Put your options in a Bundel and let friends vote. No account needed." },
  { emoji: "🏆", title: "Year in review", body: "Rank your favourite albums, films and places, then share each category as a Story." },
  { emoji: "🔔", title: "Follow", body: "Every profile has RSS and email updates, so people can follow what you collect." },
]

export default async function HomePage() {
  const session = await auth()

  if (session?.user?.id) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-bg">
      <header className="pt-safe">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <span className="inline-flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-bg">
              <Link2 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Bundel
          </span>
          <span className="flex items-center gap-1">
            <Link href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonStyles({ size: "sm", className: "hidden sm:inline-flex" })}>
              Make a Bundel
            </Link>
          </span>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] opacity-60"
            style={{ background: "radial-gradient(50% 60% at 78% 30%, oklch(0.93 0.05 255 / 0.7), transparent 70%), radial-gradient(40% 50% at 12% 70%, oklch(0.95 0.04 20 / 0.6), transparent 70%)" }}
            aria-hidden
          />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-6 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-14">
            <div className="animate-rise text-center lg:text-left">
              <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-ink-2 shadow-card ring-1 ring-line/60 lg:mx-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                One page for all your links
              </p>
              <h1 className="mt-6 text-[clamp(2.75rem,1.6rem+5vw,5.25rem)] font-bold leading-[1] tracking-[-0.045em] text-balance">
                All your links, one&nbsp;place.
              </h1>
              <p className="mx-auto mt-6 max-w-md text-[19px] leading-relaxed text-ink-2 text-pretty lg:mx-0">
                Stop sending five links in a row. Make one page that looks good and opens fast on any phone.
              </p>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/register" className={buttonStyles({ size: "md", className: "h-14 w-full px-7 text-base sm:w-auto" })}>
                  Make a Bundel
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <span className="text-sm text-ink-3">Free. Takes about a minute.</span>
              </div>
            </div>
            <div className="animate-rise relative [animation-delay:120ms]">
              <HomepageDemo />
              {/* Floating callouts, desktop only */}
              <div className="pointer-events-none absolute -left-4 top-24 hidden items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-[13px] font-semibold shadow-float ring-1 ring-line/60 xl:flex" aria-hidden>
                <FluentEmoji emoji="🗳️" size={22} />
                Vote for your pick
              </div>
              <div className="pointer-events-none absolute -right-2 bottom-40 hidden items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-[13px] font-semibold shadow-float ring-1 ring-line/60 xl:flex" aria-hidden>
                <FluentEmoji emoji="✅" size={22} />
                Link copied
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8 lg:pb-28">
          <h2 className="text-center text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] font-bold tracking-[-0.03em] text-balance">More than a list of links</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-[17px] text-ink-2 text-pretty">Three formats, each with its own look, all built to be shared from a phone.</p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {formats.map(({ emoji, title, body }) => {
              const tone = emojiTone(emoji)
              return (
                <li key={title} className="tone-hero grain relative overflow-hidden rounded-[32px] p-7 text-white shadow-float" {...toneProps(tone)}>
                  <span className="tone-chip grid h-14 w-14 place-items-center rounded-[30%]" {...toneProps(tone)}>
                    <FluentEmoji emoji={emoji} size={34} />
                  </span>
                  <h3 className="mt-8 text-[24px] font-bold tracking-tight">{title}</h3>
                  <p className="mt-2 text-[16px] leading-snug text-white/80 text-pretty">{body}</p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8 lg:pb-28">
          <h2 className="text-center text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] font-bold tracking-[-0.03em] text-balance">Made in a minute</h2>
          <ol className="mt-10 grid gap-3 md:grid-cols-3">
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

        <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
          <div className="tone-hero grain relative overflow-hidden rounded-[40px] px-6 py-16 text-center text-white shadow-float md:py-20" {...toneProps(emojiTone("✨"))}>
            <h2 className="mx-auto max-w-xl text-[clamp(2rem,1.2rem+3vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.035em] text-balance">Make your first Bundel</h2>
            <p className="mx-auto mt-4 max-w-md text-[17px] text-white/80 text-pretty">Paste a few links, give them a name, and send one page instead of five messages.</p>
            <Link href="/register" className={buttonStyles({ size: "md", className: "mt-8 h-14 bg-white px-8 text-base text-ink hover:bg-white/90" })}>
              Get started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/70 pb-safe">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 text-sm text-ink-3 md:px-8">
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
