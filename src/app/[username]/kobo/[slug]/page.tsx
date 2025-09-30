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
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.6',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      background: '#fff',
      color: '#000',
      minHeight: '100vh'
    }}>
      <a
        href={`/${username}/kobo`}
        style={{
          display: 'inline-block',
          marginBottom: '20px',
          color: '#0066cc',
          textDecoration: 'none',
          fontSize: '14px'
        }}
      >
        ← Back to all bundellinks
      </a>

      <h1 style={{ fontSize: '24px', marginBottom: '10px', fontWeight: 'bold' }}>
        {linkylink.title}
      </h1>
      {linkylink.subtitle && (
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '16px' }}>
          {linkylink.subtitle}
        </p>
      )}

      {linkylink.links.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic', marginTop: '20px' }}>
          No links added yet
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {linkylink.links.map((link, index) => (
            <li
              key={link.id}
              style={{
                marginBottom: '15px',
                paddingBottom: '15px',
                borderBottom: index === linkylink.links.length - 1 ? 'none' : '1px solid #eee'
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#666', marginRight: '8px' }}>
                {index + 1}.
              </span>
              <a
                href={`/${username}/kobo/${slug}/${index + 1}`}
                style={{
                  color: '#000',
                  textDecoration: 'none',
                  fontSize: '16px'
                }}
              >
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}