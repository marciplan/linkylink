import { notFound, redirect } from "next/navigation"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { incrementClicks } from "@/lib/actions"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"

interface PageProps {
  params: Promise<{
    username: string
    slug: string
    number: string
  }>
}

interface ArticleData {
  title: string
  byline?: string | null
  content: string
  textContent?: string
  length?: number
  excerpt?: string | null
  siteName?: string | null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug, number } = await params

  const linkNumber = parseInt(number, 10)
  if (isNaN(linkNumber) || linkNumber < 1) {
    return {}
  }

  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: {
      user: true,
      links: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!linkylink || linkylink.user.username !== username) {
    return {}
  }

  const targetLink = linkylink.links[linkNumber - 1]
  if (!targetLink) {
    return {}
  }

  return {
    title: `${targetLink.title} - Reader View`,
    description: `Reading: ${targetLink.title}`,
  }
}

async function fetchArticle(url: string): Promise<ArticleData | null> {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/extract-article?url=${encodeURIComponent(url)}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('Article extraction failed:', errorData.error)
      return null
    }

    const article = await response.json()
    return article
  } catch (error) {
    console.error('Failed to fetch article:', error)
    return null
  }
}

export default async function KoboReaderPage({ params }: PageProps) {
  const { username, slug, number } = await params

  // Parse the number (1-indexed)
  const linkNumber = parseInt(number, 10)

  if (isNaN(linkNumber) || linkNumber < 1) {
    notFound()
  }

  // Fetch the bundellink with links ordered by createdAt (oldest first, matching kobo page)
  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: {
      user: true,
      links: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!linkylink || linkylink.user.username !== username) {
    notFound()
  }

  // Get the link at the specified position (convert from 1-indexed to 0-indexed)
  const targetLink = linkylink.links[linkNumber - 1]

  if (!targetLink) {
    notFound()
  }

  // Track the click
  await incrementClicks(targetLink.id)

  // Try to extract article content
  const article = await fetchArticle(targetLink.url)

  // If extraction failed, redirect to the original URL
  if (!article) {
    redirect(targetLink.url)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .article-content p {
          margin-bottom: 1.5em;
        }
        .article-content p:last-child {
          margin-bottom: 0;
        }
        .article-content h1,
        .article-content h2,
        .article-content h3,
        .article-content h4,
        .article-content h5,
        .article-content h6 {
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          line-height: 1.3;
        }
        .article-content ul,
        .article-content ol {
          margin-bottom: 1.5em;
          padding-left: 2em;
        }
        .article-content li {
          margin-bottom: 0.5em;
        }
        .article-content blockquote {
          margin: 1.5em 0;
          padding-left: 1.5em;
          border-left: 4px solid #ddd;
          color: #666;
          font-style: italic;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5em 0;
        }
      `}} />
      <div style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        lineHeight: '1.7',
        padding: '20px',
        maxWidth: '700px',
        margin: '0 auto',
        background: '#fff',
        color: '#000',
        minHeight: '100vh'
      }}>
      {/* Navigation */}
      <div style={{
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <a
          href={`/${username}/kobo/${slug}`}
          style={{
            color: '#000',
            textDecoration: 'none',
            fontSize: '14px',
            padding: '8px 14px',
            border: '1px solid #333',
            borderRadius: '6px',
            background: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '500'
          }}
        >
          <ChevronLeft size={16} />
          Back to {linkylink.title}
        </a>
        <a
          href={targetLink.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#000',
            textDecoration: 'none',
            fontSize: '14px',
            padding: '8px 14px',
            border: '1px solid #333',
            borderRadius: '6px',
            background: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '500'
          }}
        >
          View Original
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Article Header */}
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '32px',
          lineHeight: '1.3',
          marginBottom: '15px',
          fontWeight: 'bold',
          color: '#000'
        }}>
          {article.title}
        </h1>

        {article.byline && (
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '10px',
            fontStyle: 'italic'
          }}>
            By {article.byline}
          </p>
        )}

        {article.siteName && (
          <p style={{
            fontSize: '14px',
            color: '#999',
            marginBottom: '5px'
          }}>
            {article.siteName}
          </p>
        )}

        {article.excerpt && (
          <p style={{
            fontSize: '18px',
            color: '#555',
            lineHeight: '1.6',
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '1px solid #eee',
            fontStyle: 'italic'
          }}>
            {article.excerpt}
          </p>
        )}
      </header>

      {/* Article Content */}
      <article
        className="article-content"
        style={{
          fontSize: '18px',
          lineHeight: '1.7',
          color: '#222'
        }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Article Navigation */}
      <div style={{
        marginTop: '60px',
        paddingTop: '30px',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px'
      }}>
        {linkNumber > 1 ? (
          <a
            href={`/${username}/kobo/${slug}/${linkNumber - 1}`}
            style={{
              color: '#000',
              textDecoration: 'none',
              fontSize: '14px',
              padding: '8px 14px',
              border: '1px solid #333',
              borderRadius: '6px',
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500'
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </a>
        ) : (
          <div style={{ width: '100px' }}></div>
        )}

        {linkNumber < linkylink.links.length ? (
          <a
            href={`/${username}/kobo/${slug}/${linkNumber + 1}`}
            style={{
              color: '#000',
              textDecoration: 'none',
              fontSize: '14px',
              padding: '8px 14px',
              border: '1px solid #333',
              borderRadius: '6px',
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500'
            }}
          >
            Next
            <ChevronRight size={16} />
          </a>
        ) : (
          <div style={{ width: '100px' }}></div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '30px',
        paddingTop: '30px',
        borderTop: '1px solid #eee',
        textAlign: 'center',
        color: '#999',
        fontSize: '14px'
      }}>
        <p>
          <a
            href={targetLink.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#000', textDecoration: 'none', fontWeight: '500' }}
          >
            Read the original article
          </a>
        </p>
        <p style={{ marginTop: '10px' }}>
          Reader view powered by{' '}
          <a href={`/${username}/kobo`} style={{ color: '#999', textDecoration: 'none' }}>
            Bundel
          </a>
        </p>
      </footer>
    </div>
    </>
  )
}
