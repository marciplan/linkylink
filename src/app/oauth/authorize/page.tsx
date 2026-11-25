import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ShieldCheck, TriangleAlert } from "lucide-react"
import { auth } from "@/lib/auth"
import { buildRedirect, checkAuthorizeRequest } from "@/lib/mcp/authorize"
import { originFromHeaders } from "@/lib/mcp/urls"
import { buttonStyles } from "@/components/ui/button"
import { answerConsent } from "./actions"
import { BundelLogo, BundelMark } from "@/components/BundelLogo"

export const metadata = { title: "Connect an AI app - Bundel", robots: { index: false } }

type SearchParams = Record<string, string | string[] | undefined>

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="pt-safe">
        <div className="mx-auto flex h-14 max-w-md items-center px-4 lg:h-20">
          <Link href="/" className="pressable inline-flex items-center gap-2 font-semibold">
            <BundelLogo />
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <div className="animate-rise">{children}</div>
      </main>
    </div>
  )
}

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams
  const params = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))

  const session = await auth()
  if (!session?.user?.id) {
    const back = `/oauth/authorize?${new URLSearchParams(params as Record<string, string>).toString()}`
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`)
  }

  const origin = originFromHeaders(await headers())
  const check = await checkAuthorizeRequest(params, origin, session.user.id)

  if (check.kind === "fatal") {
    return (
      <Frame>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/10 text-danger">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-display">Can&apos;t connect this app</h1>
        <p className="mt-2 text-[17px] text-ink-2 text-pretty">{check.message}</p>
        <Link href="/dashboard" className={buttonStyles({ variant: "secondary", size: "lg", className: "mt-8" })}>
          Back to Bundel
        </Link>
      </Frame>
    )
  }
  if (check.kind === "redirect-error") {
    redirect(buildRedirect(check.redirectUri, { error: check.error, error_description: check.description, state: check.state, iss: origin }))
  }

  const canWrite = check.scopes.split(" ").includes("bundel:write")
  const where = check.bundel ? <>your Bundel <strong className="text-ink">{check.bundel.title}</strong></> : <>all your Bundels</>

  return (
    <Frame>
      <BundelMark className="h-12" />
      <h1 className="mt-5 text-display text-balance">Connect {check.client.name} to Bundel?</h1>
      <p className="mt-2 text-[17px] text-ink-2 text-pretty">
        {check.client.name} will be able to see {where}
        {canWrite ? <> and add links to {check.bundel ? "it" : "them"}, including new sub-Bundels with what it finds</> : null}
        {!check.bundel && canWrite ? <>. It can also make new Bundels</> : null}. It can&apos;t edit or delete anything.
      </p>

      <ul className="mt-6 space-y-2 rounded-3xl bg-surface p-4 text-[14px] text-ink-2 shadow-card ring-1 ring-line/50">
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
          <span>
            After you allow it, you go back to <strong className="text-ink">{check.redirectHost}</strong>.
            {check.client.kind === "registered" ? " This app registered itself; only allow it if you just started connecting it." : null}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
          <span>Signed in as @{session.user.username}. You can disconnect it any time under You.</span>
        </li>
      </ul>

      <div className="mt-8 space-y-3">
        <form action={answerConsent.bind(null, params, true)}>
          <button type="submit" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Allow
          </button>
        </form>
        <form action={answerConsent.bind(null, params, false)}>
          <button type="submit" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Don&apos;t allow
          </button>
        </form>
      </div>
    </Frame>
  )
}
