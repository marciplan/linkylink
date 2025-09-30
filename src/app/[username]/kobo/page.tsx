import { notFound } from "next/navigation"
import { Metadata } from "next"
import { prisma } from "@/lib/prisma"

interface PageProps {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return {}
  }

  return {
    title: `@${username} - Kobo View`,
    description: `All bundellinks by @${username} in simple Kobo view`,
  }
}

export default async function UserKoboIndexPage({ params }: PageProps) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      linkylinks: {
        orderBy: { createdAt: "desc" },
        select: {
          slug: true,
          title: true,
          subtitle: true,
          _count: {
            select: {
              links: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
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
        href={`/${username}`}
        style={{
          display: 'inline-block',
          marginBottom: '20px',
          color: '#0066cc',
          textDecoration: 'none',
          fontSize: '14px'
        }}
      >
        ← Back to profile
      </a>

      <h1 style={{ fontSize: '24px', marginBottom: '10px', fontWeight: 'bold' }}>
        @{username}
      </h1>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '16px' }}>
        All Bundellinks
      </p>

      {user.linkylinks.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic', marginTop: '20px' }}>
          No bundellinks yet
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {user.linkylinks.map((bundel, idx) => (
            <li
              key={bundel.slug}
              style={{
                marginBottom: '15px',
                paddingBottom: '15px',
                borderBottom: idx === user.linkylinks.length - 1 ? 'none' : '1px solid #eee'
              }}
            >
              <a
                href={`/${username}/kobo/${bundel.slug}`}
                style={{
                  color: '#0066cc',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  display: 'block',
                  marginBottom: '4px'
                }}
              >
                {bundel.title}
              </a>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {bundel.subtitle && <span>{bundel.subtitle} • </span>}
                {bundel._count.links} {bundel._count.links === 1 ? 'link' : 'links'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}