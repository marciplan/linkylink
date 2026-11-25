import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { SITE, shareMetadata } from "@/lib/seo"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const rootShare = shareMetadata({ title: "Bundel: all your links, one page", description: SITE.description, path: "/", imageAlt: "Bundel: all your links, one page" })

export const metadata: Metadata = {
  title: "Bundel: all your links, one page",
  description: SITE.description,
  keywords: ["link in bio", "link list", "share links", "wishlist", "travel planning", "bookmarks", "MCP", "Claude", "ChatGPT"],
  authors: [{ name: "Bundel" }],
  applicationName: "Bundel",
  appleWebApp: {
    capable: true,
    title: "Bundel",
    statusBarStyle: "default",
  },
  // Ensure all relative URLs in metadata resolve to absolute URLs
  // so social crawlers can fetch images correctly in production.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000"
  ),
  ...rootShare,
  // Pages set their own canonical and URL; the layout must not claim "/" for all of them.
  alternates: undefined,
  openGraph: { ...rootShare.openGraph, url: undefined },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#111114" },
  ],
}

// Applies the stored/system theme before first paint so there is no flash.
const themeScript = `(function(){try{var t=localStorage.getItem('linkylink-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dark':'light')}catch(e){}})()`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
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
