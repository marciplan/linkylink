import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Link2, Search } from "lucide-react"
import { LinkylinkCard } from "@/components/LinkylinkCard"
import { DashboardSearch } from "@/components/DashboardSearch"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const sp = await searchParams
  const searchQuery = sp.search?.trim()
  
  const linkylinks = await prisma.linkLink.findMany({
    where: {
      userId: session.user.id,
      ...(searchQuery && {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { subtitle: { contains: searchQuery, mode: 'insensitive' } },
          { 
            links: {
              some: {
                OR: [
                  { title: { contains: searchQuery, mode: 'insensitive' } },
                  { url: { contains: searchQuery, mode: 'insensitive' } },
                  { context: { contains: searchQuery, mode: 'insensitive' } }
                ]
              }
            }
          }
        ]
      })
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      avatar: true,
      slug: true,
      views: true,
      headerImage: true,
      createdAt: true,
      _count: {
        select: { links: true },
      },
    },
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
              <Link href="/directory" className="text-sm text-gray-600 hover:text-gray-900">
                Browse
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
            <h1 className="text-3xl font-semibold text-gray-900">Your Bundels</h1>
            <p className="text-gray-600 mt-2">Manage and share your link collections</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <DashboardSearch initialValue={searchQuery} />
          </div>

          {/* Bundels grid */}
          {linkylinks.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
              {searchQuery ? (
                <>
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-medium text-gray-900 mb-2">No results found</h2>
                  <p className="text-gray-600 mb-6">Try adjusting your search terms or create a new Bundel</p>
                </>
              ) : (
                <>
                  <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-medium text-gray-900 mb-2">No Bundels yet</h2>
                  <p className="text-gray-600 mb-6">Create your first Bundel to get started</p>
                </>
              )}
              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
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
                  avatar={linkylink.avatar}
                  userImage={session.user.image}
                  slug={linkylink.slug}
                  username={session.user.username || session.user.email?.split("@")[0] || "user"}
                  linkCount={linkylink._count.links}
                  views={linkylink.views}
                  headerImage={linkylink.headerImage}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
