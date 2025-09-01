import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ArrowRight, Link2 } from "lucide-react"
import { HomepageDemo } from "@/components/HomepageDemo"

export default async function HomePage() {
  const session = await auth()
  
  if (session?.user?.id) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              <span className="font-medium">LinkyLink</span>
            </div>
            <nav>
              {session ? (
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-6">
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-5xl mx-auto py-20">
          <h1 className="text-5xl sm:text-6xl font-medium text-gray-900 mb-6">
            All your links, one place
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto">
            Stop sending multiple links. Create one page that works.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Go to dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Start now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/directory"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  See examples
                </Link>
              </>
            )}
          </div>

          {/* Animated Demo */}
          <HomepageDemo />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 LinkyLink
            </div>
            <div className="flex gap-6">
              <Link href="/directory" className="text-sm text-gray-500 hover:text-gray-700">
                Directory
              </Link>
              <Link href="/about" className="text-sm text-gray-500 hover:text-gray-700">
                About
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}