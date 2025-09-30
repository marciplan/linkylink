import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Link2, Lightbulb } from "lucide-react"
import { RecommendationsClient } from "@/components/RecommendationsClient"

export default async function RecommendationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch all user's bundles with their links
  const bundles = await prisma.linkLink.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      links: {
        orderBy: { order: 'asc' }
      },
      user: {
        select: {
          username: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  })

  // Fetch dismissed recommendations
  const dismissedLinkIds = await prisma.dismissedRecommendation.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      linkId: true
    }
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
            <div className="flex items-center gap-3 mb-2">
              <Lightbulb className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-semibold text-gray-900">Recommendations</h1>
            </div>
            <p className="text-gray-600">AI-powered suggestions to organize your links across Bundels</p>
          </div>

          {/* Recommendations */}
          {bundles.length < 2 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Not enough Bundels</h2>
              <p className="text-gray-600 mb-6">Create at least 2 Bundels to get recommendations</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800"
              >
                Create Bundel
              </Link>
            </div>
          ) : (
            <RecommendationsClient
              bundles={bundles}
              dismissedLinkIds={dismissedLinkIds.map(d => d.linkId)}
            />
          )}
        </div>
      </main>
    </div>
  )
}
