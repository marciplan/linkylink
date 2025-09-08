import { prisma } from "@/lib/prisma"
export const dynamic = 'force-dynamic'
import { LinkylinkCard } from "@/components/LinkylinkCard"
import Link from "next/link"
import { Search, Link2 } from "lucide-react"

export default async function DirectoryPage() {
  const linkylinks = await prisma.linkLink.findMany({
    where: { isPublic: true },
    include: {
      user: true,
      _count: {
        select: { links: true },
      },
    },
    orderBy: { views: "desc" },
    take: 50,
  })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              <span className="font-medium">Bundel</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/create" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                New Bundel
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">Discover Bundels</h1>
            <p className="text-gray-600 mt-2">Browse and explore public link collections</p>
          </div>

          {/* Search (placeholder for now) */}
          <div className="relative mb-8 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Bundels..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
              disabled
            />
          </div>

          {/* Bundels grid */}
          {linkylinks.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
              <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">No public Bundels yet</h2>
              <p className="text-gray-600 mb-6">Be the first to create a public Bundel!</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800"
              >
                Create Bundel
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {linkylinks.map((linkylink) => (
                <LinkylinkCard
                  key={linkylink.id}
                  title={linkylink.title}
                  subtitle={linkylink.subtitle}
                  slug={linkylink.slug}
                  username={linkylink.user.username}
                  linkCount={linkylink._count.links}
                  views={linkylink.views}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
