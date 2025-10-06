import { NextRequest, NextResponse } from "next/server"
import { JSDOM } from "jsdom"
import { Readability } from "@mozilla/readability"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      )
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        return NextResponse.json(
          { error: "Only HTTP and HTTPS URLs are supported" },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }

    // Fetch the HTML content with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    let html: string
    try {
      const response = await fetch(validUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BundelBot/1.0; +https://bundel.link)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch article: ${response.status} ${response.statusText}`,
            canRedirect: true
          },
          { status: response.status }
        )
      }

      // Check content type
      const contentType = response.headers.get('content-type')
      if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        return NextResponse.json(
          {
            error: "URL does not point to an HTML page",
            canRedirect: true
          },
          { status: 415 }
        )
      }

      html = await response.text()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return NextResponse.json(
            {
              error: "Request timeout - article took too long to load",
              canRedirect: true
            },
            { status: 504 }
          )
        }
        return NextResponse.json(
          {
            error: `Failed to fetch article: ${error.message}`,
            canRedirect: true
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: "Failed to fetch article",
          canRedirect: true
        },
        { status: 500 }
      )
    }

    // Parse HTML with JSDOM
    let dom: JSDOM
    try {
      dom = new JSDOM(html, { url: validUrl.toString() })
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to parse HTML content",
          canRedirect: true
        },
        { status: 500 }
      )
    }

    // Extract article with Readability
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) {
      return NextResponse.json(
        {
          error: "Could not extract article content from this page",
          canRedirect: true
        },
        { status: 422 }
      )
    }

    // Return the parsed article
    return NextResponse.json({
      title: article.title,
      byline: article.byline,
      content: article.content,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt,
      siteName: article.siteName,
    })

  } catch (error) {
    console.error("Article extraction error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        canRedirect: true
      },
      { status: 500 }
    )
  }
}
