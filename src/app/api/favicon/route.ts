import { NextResponse } from "next/server"

async function tryFaviconUrl(faviconUrl: string, timeout: number = 8000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    // Try HEAD first, then fallback to GET if HEAD fails
    let response: Response | null = null
    
    try {
      response = await fetch(faviconUrl, { 
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Linkylink/1.0; +https://linkylink.com)'
        }
      })
    } catch {
      // Some servers don't support HEAD, try GET with small range
      try {
        response = await fetch(faviconUrl, { 
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Linkylink/1.0; +https://linkylink.com)',
            'Range': 'bytes=0-1023' // Only fetch first 1KB to check if valid
          }
        })
      } catch {
        return false
      }
    }
    
    clearTimeout(timeoutId)
    
    if (response && response.ok) {
      const contentType = response.headers.get('content-type') || ''
      // Verify it's actually an image
      return contentType.startsWith('image/') || 
             contentType.includes('icon') || 
             faviconUrl.includes('google.com/s2/favicons') ||
             faviconUrl.includes('icons.duckduckgo.com')
    }
    
    return false
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace(/^www\./, '')

    // Comprehensive favicon sources in order of preference
    const faviconUrls = [
      // High-quality services first
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      
      // Try common favicon paths on the actual domain
      `${urlObj.origin}/favicon.ico`,
      `${urlObj.origin}/apple-touch-icon.png`,
      `${urlObj.origin}/apple-touch-icon-180x180.png`,
      `${urlObj.origin}/favicon-32x32.png`,
      `${urlObj.origin}/favicon-16x16.png`,
      
      // Try with www prefix if not already present
      ...(urlObj.hostname.startsWith('www.') ? [] : [
        `https://www.${domain}/favicon.ico`,
        `https://www.${domain}/apple-touch-icon.png`
      ]),
      
      // Fallback services
      `https://favicons.githubusercontent.com/${domain}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    ]

    // Try each favicon URL with shorter individual timeouts but more attempts
    for (const faviconUrl of faviconUrls) {
      const isValid = await tryFaviconUrl(faviconUrl, 6000)
      if (isValid) {
        return NextResponse.json({ favicon: faviconUrl })
      }
    }

    // If all fail, return null
    return NextResponse.json({ favicon: null })
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }
}