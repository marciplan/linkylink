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

    // Try multiple favicon sources
    const faviconUrls = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `${urlObj.origin}/favicon.ico`,
      `${urlObj.origin}/apple-touch-icon.png`,
    ]

    // Return the Google favicon as default (most reliable)
    return NextResponse.json({ favicon: faviconUrls[0] })
  } catch (error) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }
}