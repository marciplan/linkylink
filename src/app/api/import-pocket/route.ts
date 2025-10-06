import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

interface PocketLink {
  url: string
  title: string
  excerpt?: string
  tags?: string
}

function parseCSV(csvText: string): PocketLink[] {
  const lines = csvText.split('\n')
  if (lines.length === 0) {
    return []
  }

  // Get headers from first line
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  const links: PocketLink[] = []

  // Parse each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV parsing (handles quoted fields)
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    // Create object from headers and values
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header.toLowerCase()] = values[index] || ''
    })

    // Extract link data - Pocket CSV typically has: url, title, excerpt, tags, time_added
    const url = row.url || row.link || row.resolved_url
    const title = row.title || row.resolved_title || url

    if (url && url.startsWith('http')) {
      links.push({
        url,
        title: title || 'Untitled',
        excerpt: row.excerpt,
        tags: row.tags
      })
    }
  }

  return links
}

async function fetchFavicon(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/favicon?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return data.favicon || null
    }
    return null
  } catch (error) {
    console.log('Favicon fetch failed for', url, ':', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file content
    const csvText = await file.text()

    // Parse CSV
    const pocketLinks = parseCSV(csvText)

    if (pocketLinks.length === 0) {
      return NextResponse.json({ error: "No valid links found in CSV" }, { status: 400 })
    }

    // Create the Bundel (LinkLink)
    const title = "My Pocket Links"
    const slug = generateSlug(title)
    let counter = 0
    let uniqueSlug = slug

    while (await prisma.linkLink.findUnique({ where: { slug: uniqueSlug } })) {
      counter++
      uniqueSlug = `${slug}-${counter}`
    }

    const bundel = await prisma.linkLink.create({
      data: {
        title,
        subtitle: null,
        slug: uniqueSlug,
        userId: session.user.id,
      },
      include: {
        user: true
      }
    })

    // Trigger background generation for emoji and background
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-defaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkylinkId: bundel.id,
        title,
        subtitle: null
      }),
    }).catch(err => {
      console.error('Failed to trigger background generation:', err)
    })

    // Import links in batches to avoid timeouts
    const BATCH_SIZE = 10
    for (let i = 0; i < pocketLinks.length; i += BATCH_SIZE) {
      const batch = pocketLinks.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (pocketLink, batchIndex) => {
          const order = i + batchIndex
          const favicon = await fetchFavicon(pocketLink.url)

          return prisma.link.create({
            data: {
              title: pocketLink.title,
              url: pocketLink.url,
              favicon,
              context: pocketLink.excerpt || undefined,
              order,
              linkylinkId: bundel.id,
            },
          })
        })
      )
    }

    return NextResponse.json({
      username: bundel.user.username,
      slug: bundel.slug,
      linkCount: pocketLinks.length
    })

  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Failed to import Pocket data" },
      { status: 500 }
    )
  }
}
