import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Outfit } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Bundel - Share Multiple Links Beautifully",
  description: "Create beautiful link pages to share multiple URLs at once. Perfect for social media, portfolios, and resource collections.",
  keywords: ["links", "share", "social", "linktree", "bio link"],
  authors: [{ name: "Bundel" }],
  // Ensure all relative URLs in metadata resolve to absolute URLs
  // so social crawlers can fetch images correctly in production.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000"
  ),
  openGraph: {
    title: "Bundel - Share Multiple Links Beautifully",
    description: "Create beautiful link pages to share multiple URLs at once.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bundel - Share Multiple Links Beautifully",
    description: "Create beautiful link pages to share multiple URLs at once.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        {/* Rybbit Analytics */}
        <Script
          src="https://app.rybbit.io/api/script.js"
          data-site-id="f67ba44934d8"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
