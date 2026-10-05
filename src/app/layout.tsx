import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Bundel - Share Multiple Links Beautifully",
  description: "Create beautiful link pages to share multiple URLs at once. Perfect for social media, portfolios, and resource collections.",
  keywords: ["links", "share", "social", "linktree", "bio link"],
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
  openGraph: {
    title: "Bundel - Share Multiple Links Beautifully",
    description: "Create beautiful link pages to share multiple URLs at once.",
    type: "website",
    siteName: "Bundel",
    locale: "en_US",
    images: [
      {
        url: "/api/og/default",
        width: 1200,
        height: 630,
        alt: "Bundel - All your links, one place",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bundel - Share Multiple Links Beautifully",
    description: "Create beautiful link pages to share multiple URLs at once.",
    images: ["/api/og/default"],
  },
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
