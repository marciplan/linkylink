import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    // Try multiple favicon sources in order
    const faviconUrls = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `${urlObj.origin}/favicon.ico`,
      `${urlObj.origin}/apple-touch-icon.png`,
    ]

    // Try each favicon URL until we find one that works
    for (const faviconUrl of faviconUrls) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(faviconUrl, { 
          method: 'HEAD',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          return NextResponse.json({ favicon: faviconUrl })
        }
      } catch {
        // Continue to next favicon source
        continue
      }
    }

    // If all fail, return a default favicon or null
    return NextResponse.json({ favicon: null })
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }
}