import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import { InView } from "./InView"
import { AiChatLoop, IconCycle } from "./LoopingVisuals"
import { delay, rise } from "./motion"
import { FluentEmoji } from "@/components/FluentEmoji"
import { AskRow } from "./AskBox"
import { CopyConnectorButton } from "./CopyConnectorButton"
import { emojiTone } from "@/lib/emoji-tone"
import { toneProps } from "@/lib/tone"
import { MOMENTS } from "@/lib/moments"
import { FAQ } from "@/lib/site-knowledge"

// Homepage sections below the hero and the card grid:
// let your AI help, moments, free, questions.

const h2 = "text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-balance"
const lead = "mt-3 max-w-lg text-[17px] leading-relaxed text-ink-2 text-pretty"
const section = "mx-auto max-w-6xl px-5 pb-20 md:px-8 lg:pb-28"


export function AiSection() {
  return (
    <section id="ai" className={`${section} scroll-mt-20`}>
      <div className="relative overflow-hidden rounded-[40px] bg-ink p-6 text-bg md:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(60% 60% at 85% 10%, oklch(0.55 0.12 265 / 0.5), transparent 70%)" }} aria-hidden />
        <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <h2 className={h2}>Let your AI do the legwork</h2>
            <p className="mt-3 max-w-lg text-[17px] leading-relaxed text-bg/75 text-pretty">
              Works with Claude and ChatGPT. Connect your AI app to Bundel once. Then just ask: add this to my list, find deals for these headphones, find places to stay near the venue. It searches the web and saves what it finds right under the link.
            </p>
            <ol className="mt-6 space-y-2.5 text-[15px] text-bg/85">
              {["Copy the connector URL and add it in Claude or ChatGPT.", "Allow it on Bundel: one Bundel or your whole account.", "Ask. Results show up as “5 deals found”, only for you."].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bg/15 text-[12px] font-bold">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-col items-start gap-3">
              <CopyConnectorButton className="bg-bg text-ink hover:bg-bg/90" />
              <span className="pl-1 text-[13px] text-bg/55">Uses MCP, the open standard for AI apps. It can add, never delete.</span>
            </div>
          </div>

          <AiChatLoop />
        </div>
      </div>
    </section>
  )
}

export function MomentsSection() {
  return (
    <section id="moments" className={`${section} scroll-mt-20`}>
      <h2 className={`${h2} text-center`}>Made for moments like these</h2>
      <p className={`${lead} mx-auto text-center`}>Start from a ready-made Bundel and make it yours.</p>
      {/* A swipeable row on phones, a grid from sm up */}
      <ul className="-mx-5 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
        {MOMENTS.map((m) => {
          const tone = emojiTone(m.emoji)
          return (
            <li key={m.slug} className="w-[78%] shrink-0 snap-center sm:w-auto">
              <Link href={`/moments/${m.slug}`} className="pressable tone-hero grain group flex h-full flex-col rounded-[28px] p-5 text-white shadow-float" {...toneProps(tone)}>
                <span className="tone-chip grid h-12 w-12 place-items-center rounded-[30%]" {...toneProps(tone)}>
                  <FluentEmoji emoji={m.emoji} size={28} />
                </span>
                <span className="mt-8 text-[19px] font-bold tracking-tight">{m.title}</span>
                <span className="mt-1 flex-1 text-[14px] leading-snug text-white/80 text-pretty">{m.line}</span>
                {/* The sites a Bundel like this collects from, swapping one at a time */}
                <span className="mt-5">
                  <IconCycle domains={m.sites} />
                </span>
                <span className="mt-4 inline-flex h-10 w-fit items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-ink shadow-[0_8px_20px_-8px_rgb(0_0_0/0.45)] transition-transform group-hover:scale-[1.03]">
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const promises = [
  { emoji: "💸", title: "Free to use", body: "Make as many Bundels as you like. No ads on them, ever." },
  { emoji: "🙌", title: "No sign-up for friends", body: "They open, vote and suggest links without an account." },
  { emoji: "🔒", title: "Your data stays yours", body: "We don't sell it or follow you around the web." },
]

export function FreeSection() {
  return (
    <section className={section}>
      <h2 className={`${h2} text-center`}>Free. No catch.</h2>
      <InView>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {promises.map(({ emoji, title, body }, i) => {
            const tone = emojiTone(emoji)
            return (
              <li key={title} className={`flex items-center gap-4 rounded-[28px] bg-surface-2 p-5 md:flex-col md:rounded-[32px] md:px-6 md:pb-9 md:pt-10 md:text-center ${rise}`} style={delay(i * 120)}>
                <span className="tone-hero tone-icon grain grid h-14 w-14 shrink-0 place-items-center rounded-[28%] shadow-[0_20px_36px_-16px_rgb(0_0_0/0.45)] md:h-20 md:w-20" {...toneProps(tone)}>
                  <FluentEmoji emoji={emoji} size={44} className="!h-[55%] !w-[55%]" />
                </span>
                <span className="min-w-0">
                  <h3 className="text-[18px] font-semibold tracking-tight md:mt-2 md:text-[20px]">{title}</h3>
                  <p className="mt-0.5 text-[14.5px] text-ink-3 text-pretty md:mx-auto md:mt-1.5 md:max-w-[26ch] md:text-[15px]">{body}</p>
                </span>
              </li>
            )
          })}
        </ul>
      </InView>
    </section>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className={`${section} scroll-mt-20`}>
      <h2 className={`${h2} text-center`}>Questions, answered</h2>
      <div className="mx-auto mt-10 max-w-3xl divide-y divide-line/70 overflow-hidden rounded-[32px] bg-surface shadow-card ring-1 ring-line/50">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="group px-5 md:px-7">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-5 text-[15px] leading-relaxed text-ink-2 text-pretty">{a}</p>
          </details>
        ))}
        <AskRow />
      </div>
    </section>
  )
}

/** FAQPage structured data, so search engines can show the answers. */
export function faqJsonLd() {
  return {
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  }
}
