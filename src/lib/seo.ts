import type { Metadata } from "next"

// One place for share metadata. A page's openGraph replaces the root layout's
// openGraph as a whole (no deep merge), so every page builds the full set here:
// otherwise a shared Bundel would lose its site name, locale or card type.

export const SITE = {
  name: "Bundel",
  tagline: "All your links, one page.",
  description: "Collect links and share them as one beautiful page. Bundel your trip ideas, gift lists and finds, and let your AI app add to them.",
  locale: "en_US",
  defaultImage: "/api/og/default",
}

interface ShareInput {
  title: string
  description: string
  /** Path of the page, e.g. /marciano/black-friday. */
  path: string
  /** Canonical path when it differs from path, e.g. a ?l= share of one link folds into its Bundel. */
  canonical?: string
  image?: string
  imageAlt?: string
  type?: "website" | "article" | "profile"
}

export function shareMetadata({ title, description, path, canonical = path, image = SITE.defaultImage, imageAlt, type = "website" }: ShareInput): Pick<Metadata, "openGraph" | "twitter" | "alternates"> {
  const images = [{ url: image, width: 1200, height: 630, alt: imageAlt ?? title, type: "image/png" }]
  return {
    alternates: { canonical },
    openGraph: { title, description, url: path, siteName: SITE.name, locale: SITE.locale, type, images },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt: imageAlt ?? title }] },
  }
}
