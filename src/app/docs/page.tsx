import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Check, Eye, GripVertical, MoreHorizontal, Paintbrush, Plus, Share, Sparkles, X } from "lucide-react"
import { FluentEmoji } from "@/components/FluentEmoji"
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome"
import { CopyConnectorButton } from "@/components/landing/CopyConnectorButton"
import { buttonStyles } from "@/components/ui/button"
import { emojiTone } from "@/lib/emoji-tone"
import { shareMetadata } from "@/lib/seo"
import { toneProps } from "@/lib/tone"

const TITLE = "How to use Bundel"
const DESCRIPTION = "Make a Bundel, share it, let friends vote, and connect Claude or ChatGPT to add links and find deals for you."

export const metadata: Metadata = {
  title: `${TITLE} - Bundel`,
  description: DESCRIPTION,
  ...shareMetadata({ title: TITLE, description: DESCRIPTION, path: "/docs" }),
}

const SECTIONS = [
  { id: "start", emoji: "✨", title: "Make your first Bundel" },
  { id: "adding", emoji: "📥", title: "Add links from anywhere" },
  { id: "sharing", emoji: "🔗", title: "Share it" },
  { id: "voting", emoji: "🗳️", title: "Let friends vote" },
  { id: "connect", emoji: "🔌", title: "Connect your AI" },
  { id: "asking", emoji: "💬", title: "What you can ask" },
  { id: "results", emoji: "🛍️", title: "Research results" },
  { id: "skip", emoji: "🚫", title: "Sites to skip" },
  { id: "privacy", emoji: "🔒", title: "Privacy and control" },
  { id: "help", emoji: "🛟", title: "Troubleshooting" },
]

/** A section with its emoji tile, an anchor, and a little room. */
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  const s = SECTIONS.find((x) => x.id === id)!
  const tone = emojiTone(s.emoji)
  return (
    <section id={id} className="scroll-mt-24 border-t border-line/70 py-12 first:border-t-0 first:pt-0">
      <h2 className="flex items-center gap-3 text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-bold tracking-[-0.03em]">
        <span className="tone-hero tone-icon grain grid h-11 w-11 shrink-0 place-items-center rounded-[28%] shadow-[0_12px_24px_-12px_rgb(0_0_0/0.45)]" {...toneProps(tone)}>
          <FluentEmoji emoji={s.emoji} size={24} />
        </span>
        {s.title}
      </h2>
      <div className="mt-5 space-y-4 text-[16.5px] leading-relaxed text-ink-2 [&_b]:font-semibold [&_b]:text-ink">{children}</div>
    </section>
  )
}

/** Numbered steps. */
function Steps({ children }: { children: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {children.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-bg">{i + 1}</span>
          <span className="min-w-0 flex-1">{step}</span>
        </li>
      ))}
    </ol>
  )
}

/** An inline picture of a button in the app, so people know what to look for. */
function Ui({ icon, children }: { icon?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-surface px-2 py-0.5 align-middle text-[13.5px] font-semibold text-ink shadow-card ring-1 ring-line/60">
      {icon}
      {children}
    </span>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-3 rounded-2xl bg-surface-2 p-4 text-[15px]">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
      <span>{children}</span>
    </p>
  )
}

/** A chat-style example: what you type. */
function Ask({ children, note }: { children: React.ReactNode; note: string }) {
  return (
    <li className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line/50">
      <p className="w-fit rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-[15px] text-bg">{children}</p>
      <p className="mt-2 text-[14.5px] text-ink-3">{note}</p>
    </li>
  )
}

const icon = "h-3.5 w-3.5"

export default function DocsPage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-bg">
      <SiteHeader />
      <main className="flex-1">
        <header className="px-5 pb-10 pt-12 text-center md:px-8 md:pt-16">
          <h1 className="mx-auto max-w-[14ch] text-[clamp(2.4rem,1rem+4.6vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.05em] text-balance">How to use Bundel</h1>
          <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,0.95rem+0.4vw,1.2rem)] leading-relaxed text-ink-2 text-pretty">{DESCRIPTION}</p>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-5 pb-24 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Contents */}
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="px-3 text-[12px] font-semibold uppercase tracking-wide text-ink-3">On this page</p>
            <ul className="mt-2 flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex-col lg:gap-0.5 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              {SECTIONS.map((s) => (
                <li key={s.id} className="shrink-0">
                  <a href={`#${s.id}`} className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[14px] font-medium text-ink-2 ring-1 ring-line/60 hover:text-ink lg:rounded-xl lg:bg-transparent lg:ring-0 lg:hover:bg-ink/5">
                    <FluentEmoji emoji={s.emoji} size={16} />
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="min-w-0 max-w-2xl">
            <Section id="start">
              <p>A Bundel is one page with a set of links: trip ideas, a gift list, recipes, things to buy. You send one link instead of five messages.</p>
              <Steps>
                {[
                  <>Make a free account, then tap <Ui icon={<Plus className={icon} />}>New Bundel</Ui>.</>,
                  <>Give it a name, like <b>Lisbon trip</b>. Paste your first link if you have one.</>,
                  <>Add more links with <Ui icon={<Plus className={icon} />}>Add link</Ui>. The title and icon fill themselves in.</>,
                  <>Tap a link to edit it or add a note under it. Drag <Ui icon={<GripVertical className={icon} />} /> to reorder. On a phone, swipe a link left to remove it; on a computer, right-click it.</>,
                  <>Tap the <Ui icon={<Paintbrush className={icon} />} /> on the icon to pick a different emoji or background. Every Bundel gets its own colours either way.</>,
                ]}
              </Steps>
            </Section>

            <Section id="adding">
              <ul className="list-disc space-y-2 pl-5">
                <li><b>On a computer:</b> paste a link anywhere on your Bundel, or drop it onto the page.</li>
                <li><b>On Android:</b> install Bundel from your browser (Add to home screen). It then shows up in the share sheet: share a link from any app and pick a Bundel.</li>
                <li><b>On iPhone:</b> copy the link and paste it in Bundel. Add Bundel to your home screen from Safari&apos;s share menu for quick access.</li>
                <li><b>From Pocket:</b> export your saves from Pocket, then import the file on the <Link href="/pocket" className="font-semibold text-ink underline underline-offset-4">Pocket import page</Link>. Everything lands in a new Bundel.</li>
                <li><b>By asking your AI:</b> once connected, say &ldquo;add this to my gift list&rdquo;. See <a href="#connect" className="font-semibold text-ink underline underline-offset-4">Connect your AI</a>.</li>
              </ul>
            </Section>

            <Section id="sharing">
              <ul className="list-disc space-y-2 pl-5">
                <li>Tap <Ui icon={<Share className={icon} />}>Share</Ui> to send your Bundel, or copy its link from the <Ui icon={<MoreHorizontal className={icon} />} /> menu.</li>
                <li>The link shows a proper preview in WhatsApp, iMessage and social apps, with your Bundel&apos;s title, colours and first links.</li>
                <li>Tap <Ui icon={<Eye className={icon} />} /> to see your Bundel the way visitors do.</li>
                <li>Your profile at <b>bundel.link/your-name</b> lists your Bundels. It works well as a link in bio.</li>
                <li>People can follow you by email or RSS from your profile and hear about new links.</li>
              </ul>
              <Tip>Bundels are public: anyone with the link can open them. Keep anything private out of them.</Tip>
            </Section>

            <Section id="voting">
              <p>Can&apos;t decide where to stay or what to give? Turn a Bundel into a vote.</p>
              <Steps>
                {[
                  <>Open the <Ui icon={<MoreHorizontal className={icon} />} /> menu and choose <Ui>Ask for votes</Ui>.</>,
                  <>Switch on <b>Ask mode</b> and pick <b>Pick one</b> or <b>Pick any</b>.</>,
                  <>Optional: turn on <b>Let people suggest links</b>. Suggestions wait for you to accept them.</>,
                  <>Share the link. Friends vote without an account; you see who picked what.</>,
                  <>When you&apos;ve decided, choose <b>Close voting</b> to show the result and stop new votes.</>,
                ]}
              </Steps>
            </Section>

            <Section id="connect">
              <p>Connect Claude or ChatGPT to Bundel once. After that you can add links and run research just by chatting. It uses MCP, the open standard for connecting AI apps.</p>
              <p><b>First, choose what it may reach:</b></p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line/50">
                  <p className="font-semibold text-ink">One Bundel</p>
                  <p className="mt-1 text-[15px]">Open the Bundel, then <Ui icon={<MoreHorizontal className={icon} />} /> → <Ui icon={<Sparkles className={icon} />}>Connect AI</Ui> and copy its URL. The AI can only reach that Bundel and the research under it.</p>
                </div>
                <div className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line/50">
                  <p className="font-semibold text-ink">Your whole account</p>
                  <p className="mt-1 text-[15px]">Use the URL below, or find it under <b>Account → Connected AI apps</b> (<b>You</b> on a phone). The AI can reach all your Bundels and make new ones.</p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 rounded-2xl bg-surface-2 p-4">
                <code className="break-all text-[14px] font-semibold text-ink">https://www.bundel.link/mcp</code>
                <CopyConnectorButton />
              </div>

              <p className="pt-2"><b>In Claude</b> (claude.ai or the Claude app):</p>
              <Steps>
                {[
                  <>Open <b>Settings → Connectors</b> and choose <b>Add custom connector</b>.</>,
                  <>Name it <b>Bundel</b>, paste the URL and choose <b>Add</b>, then <b>Connect</b>.</>,
                  <>Bundel opens. Sign in if needed, check what the app may do, and choose <b>Allow</b>.</>,
                  <>Back in Claude, start a chat and ask away. Make sure the Bundel connector is switched on for the chat.</>,
                ]}
              </Steps>

              <p className="pt-2"><b>In ChatGPT:</b></p>
              <Steps>
                {[
                  <>Open <b>Settings → Apps &amp; Connectors</b>. Custom connectors may need <b>developer mode</b>, under Advanced.</>,
                  <>Create a connector, name it <b>Bundel</b>, paste the URL and pick <b>OAuth</b> as the sign-in method.</>,
                  <>Bundel opens: sign in and choose <b>Allow</b>.</>,
                  <>In a new chat, turn on the Bundel connector and ask.</>,
                ]}
              </Steps>
              <Tip>Menu names in Claude and ChatGPT change now and then. If you can&apos;t find a step, look for &ldquo;connectors&rdquo; in their settings.</Tip>
            </Section>

            <Section id="asking">
              <p>Talk normally. Mention the Bundel by name so the AI picks the right one.</p>
              <ul className="space-y-3">
                <Ask note="Adds it, skipping anything that's already there.">Add this to my Black Friday list: https://…</Ask>
                <Ask note="Whole-account connections only.">Make a Bundel called Lisbon trip with these links</Ask>
                <Ask note="Searches shops, shows you the deals, saves them under the product.">Find deals for the Sony headphones in my Black Friday list</Ask>
                <Ask note="Similar products, places or services, each with how it differs.">Find alternatives to the record player in my gift list</Ask>
                <Ask note="Hotels and rentals near a venue, restaurant or event.">Find places to stay near the venue in my wedding Bundel</Ask>
                <Ask note="Checks every link and saves a ranking with its pick.">Compare the links in my Places to see Bundel</Ask>
              </ul>
              <Tip>In Bundel, tap a link and pick an activity under <b>Research with AI</b>. It copies a ready-made request to paste in your AI app.</Tip>
            </Section>

            <Section id="results">
              <p>Research lands right under the link it&apos;s about, as a private sub-Bundel only you can see.</p>
              <div className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line/50">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50">
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative favicon */}
                    <img src="https://www.google.com/s2/favicons?domain=sony.com&sz=64" alt="" width={20} height={20} />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">Sony WH-1000XM6</span>
                    <span className="block text-[13px] text-ink-3">sony.com</span>
                  </span>
                </div>
                <span className="ml-[52px] mt-2 inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-[13px] font-semibold text-sky-900 ring-1 ring-sky-300/60 dark:bg-sky-950 dark:text-sky-100">5 deals found</span>
              </div>
              <ul className="list-disc space-y-2 pl-5">
                <li>Tap the chip to see the first results in place. <b>Open as Bundel</b> shows all of them.</li>
                <li>Don&apos;t like one? Tap <Ui icon={<X className={icon} />} /> and choose <b>Remove</b>, or <b>Never show</b> to skip that site from now on.</li>
                <li>Ask again later and new results are added to the same sub-Bundel.</li>
                <li>Deleting a link also deletes the research under it.</li>
              </ul>
            </Section>

            <Section id="skip">
              <p>Never want results from a certain shop or site? Add it under <b>Account → Sites to skip</b> (<b>You</b> on a phone), for example <b>amazon.com</b>.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>The AI is told to avoid those sites, and Bundel drops any result from them before saving, subdomains included.</li>
                <li>It only affects AI research. Links you add yourself always go in.</li>
                <li>&ldquo;Never show&rdquo; on a result adds its site here for you.</li>
              </ul>
            </Section>

            <Section id="privacy">
              <ul className="space-y-2.5">
                {[
                  "The AI can add links and make Bundels. It can never edit or delete anything.",
                  "A connection made from one Bundel only reaches that Bundel and the research under it.",
                  "Research results are private sub-Bundels: only you can see them.",
                  "You approve every connection on Bundel itself, and see which app it is first.",
                  "Each connection can do up to 200 actions a day.",
                  "Disconnect any app any time under Account → Connected AI apps. It stops working right away.",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="help">
              <dl className="space-y-5">
                {[
                  ["The AI says it isn't connected or asks me to sign in again", "Open the connector in your AI app and choose Connect again, then Allow on Bundel. If you disconnected it under Account, this is expected."],
                  ["It can't make a new Bundel", "You connected one Bundel, not your whole account. Connect again with https://www.bundel.link/mcp."],
                  ["It picked the wrong Bundel", "Say the Bundel's exact name, or ask it to list your Bundels first."],
                  ["I don't see the results", "Refresh the Bundel page. Results show under the link as a chip like “5 deals found”, only when you're signed in."],
                  ["It says I've hit a limit", "Each connection can do 200 actions a day. It resets at midnight UTC."],
                ].map(([q, a]) => (
                  <div key={q}>
                    <dt className="font-semibold text-ink">{q}</dt>
                    <dd className="mt-1">{a}</dd>
                  </div>
                ))}
              </dl>
              <p>Still stuck? The <Link href="/#faq" className="font-semibold text-ink underline underline-offset-4">FAQ</Link> has an &ldquo;Ask your own question&rdquo; box that knows how Bundel works.</p>
            </Section>

            <div className="mt-6 rounded-[28px] bg-surface-2 p-6 text-center">
              <p className="text-[20px] font-bold tracking-tight">Ready to try it?</p>
              <Link href="/register" className={buttonStyles({ size: "md", className: "mt-4 h-12 px-6" })}>
                Make a Bundel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
