import { notFound } from "next/navigation"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"

interface PageProps {
  params: Promise<{
    username: string
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params

  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: { user: true },
  })

  if (!linkylink || linkylink.user.username !== username) {
    return {}
  }

  return {
    title: `${linkylink.title} - Kobo View`,
    description: linkylink.subtitle || `Simple view of ${linkylink.title}`,
  }
}

export default async function KoboPage({ params }: PageProps) {
  const { username, slug } = await params

  const linkylink = await prisma.linkLink.findUnique({
    where: { slug },
    include: {
      user: true,
      links: {
        orderBy: { createdAt: "asc" }, // Oldest first
      },
    },
  })

  if (!linkylink || linkylink.user.username !== username) {
    notFound()
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            color: #000;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .subtitle {
            color: #666;
            margin-bottom: 20px;
            font-size: 16px;
          }
          .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #0066cc;
            text-decoration: none;
            font-size: 14px;
          }
          .back-link:hover {
            text-decoration: underline;
          }
          .link-list {
            list-style: none;
          }
          .link-item {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          .link-item:last-child {
            border-bottom: none;
          }
          .link-number {
            font-weight: bold;
            color: #666;
            margin-right: 8px;
          }
          .link-title {
            color: #0066cc;
            text-decoration: none;
            font-size: 16px;
          }
          .link-title:hover {
            text-decoration: underline;
          }
          .no-links {
            color: #999;
            font-style: italic;
            margin-top: 20px;
          }
        `}</style>
      </head>
      <body>
        <a href={`/${username}/${slug}`} className="back-link">
          ← Back to full view
        </a>

        <h1>{linkylink.title}</h1>
        {linkylink.subtitle && (
          <p className="subtitle">{linkylink.subtitle}</p>
        )}

        {linkylink.links.length === 0 ? (
          <p className="no-links">No links added yet</p>
        ) : (
          <ul className="link-list">
            {linkylink.links.map((link, index) => (
              <li key={link.id} className="link-item">
                <span className="link-number">{index + 1}.</span>
                <a
                  href={`/${username}/${slug}/kobo/${index + 1}`}
                  className="link-title"
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </body>
    </html>
  )
}