import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Hero, ProductShot } from "@/components/landing/Hero"
import { emojiTone } from "@/lib/emoji-tone"
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome"
import { StartBundel } from "@/components/landing/StartBundel"
import { AiSection, FaqSection, FreeSection, MomentsSection, faqJsonLd } from "@/components/landing/Sections"
import { LogoStrip } from "@/components/landing/LogoStrip"
import { FeatureGrid } from "@/components/landing/FeatureGrid"
import type { Metadata } from "next"
import { SITE, shareMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Bundel: all your links, one page",
  description: SITE.description,
  ...shareMetadata({ title: "Bundel: all your links, one page", description: SITE.description, path: "/" }),
}

/** What the final call to action guesses from the name you type: emoji, keywords, example links. */
const MOODS: [string, string[], string[]][] = [
  ["✈️", ["trip", "travel", "lisbon", "holiday", "vacation", "weekend", "city"], ["Casa in Alfama", "Time Out Market", "Sintra day trip"]],
  ["🎁", ["gift", "birthday", "sinterklaas", "christmas", "present", "mum", "dad"], ["Vintage record player", "Cooking class for two", "A really good book"]],
  ["🛍️", ["black friday", "deal", "shop", "buy", "wish"], ["Sony WH-1000XM6", "Dyson Airwrap", "LEGO Millennium Falcon"]],
  ["🍝", ["pasta", "recipe", "food", "dinner", "restaurant", "cook", "eat"], ["Cacio e pepe", "Carbonara the Roman way", "Lemon ricotta pasta"]],
  ["🎧", ["music", "song", "playlist", "album", "concert"], ["Fred again.. Boiler Room", "Bon Iver live", "Four Tet Essential Mix"]],
  ["🎬", ["film", "movie", "watch", "series", "tv"], ["Past Lives", "Perfect Days", "Dune: Part Two"]],
  ["📚", ["book", "read"], ["Tomorrow, and Tomorrow", "The Overstory", "Piranesi"]],
  ["🏡", ["house", "home", "apartment", "flat", "listing"], ["3-room flat with balcony", "Corner house near the park", "Loft in the old factory"]],
  ["💍", ["wedding", "marry", "bride"], ["Orangery at the estate", "Florist: wild meadow", "First dance playlist"]],
]

export default async function HomePage() {
  const session = await auth()

  if (session?.user?.id) {
    redirect("/dashboard")
  }

  const origin = (process.env.NEXT_PUBLIC_APP_URL || "https://www.bundel.link").replace(/\/$/, "")
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Bundel", url: origin, logo: `${origin}/app-icon/512` },
      { "@type": "WebSite", name: "Bundel", url: origin, description: SITE.description },
      faqJsonLd(),
    ],
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ProductShot />

        <LogoStrip />
        <FeatureGrid />
        <AiSection />
        <MomentsSection />
        <FreeSection />
        <FaqSection />

        <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
          <StartBundel moods={MOODS.map(([emoji, keywords, links]) => ({ emoji, keywords, links, tone: emojiTone(emoji) }))} fallback={{ emoji: "✨", keywords: [], links: ["Your first link", "Another good one", "The one everyone asks for"], tone: emojiTone("✨") }} />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
