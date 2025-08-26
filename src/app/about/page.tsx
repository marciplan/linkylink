import Link from "next/link"
import { Link2, ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              <span className="font-medium">LinkyLink</span>
            </Link>
            <nav>
              <div className="flex items-center gap-6">
                <Link
                  href="/directory"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Directory
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Get started
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-medium text-gray-900 mb-8">
            About LinkyLink
          </h1>

          <div className="space-y-8 text-lg text-gray-700">
            <p>
              LinkyLink lets you share multiple links through one URL. Instead of sending five different links, you send one.
            </p>

            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">What people use it for</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• Musicians sharing their music across platforms</li>
                <li>• Content creators linking to all their social profiles</li>
                <li>• Businesses directing customers to multiple resources</li>
                <li>• Event organizers sharing registration, schedule, and location</li>
                <li>• Personal portfolios with work samples and contact info</li>
                <li>• Sharing collections of resources or recommendations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">No account needed</h2>
              <p>
                You can create and share a LinkyLink page without signing up. Just add your links and go. 
                Only create an account when you want to edit your links later.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Always free</h2>
              <p>
                LinkyLink will always be free. No premium tiers, no feature gates, no ads. 
                We built this because link sharing shouldn&apos;t be complicated or expensive.
              </p>
            </div>

            <div className="pt-8 border-t">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Start creating
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
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
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}