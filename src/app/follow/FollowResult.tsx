import Link from "next/link"
import { buttonStyles } from "@/components/ui/button"

export function FollowResult({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center pb-safe pt-safe">
      <h1 className="text-display text-balance">{title}</h1>
      <p className="mt-3 max-w-sm text-[17px] text-ink-2 text-pretty">{body}</p>
      <Link href={href} className={buttonStyles({ className: "mt-8" })}>
        {cta}
      </Link>
    </main>
  )
}
