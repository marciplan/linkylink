import Link from "next/link"
import { Link2 } from "lucide-react"

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>

          <div className="space-y-8 text-gray-700">
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">What we collect</h2>
              <p className="mb-4">
                We collect minimal information to make LinkyLink work:
              </p>
              <ul className="space-y-2">
                <li>• Email address and username when you create an account</li>
                <li>• Links and titles you add to your LinkyLink pages</li>
                <li>• Basic usage analytics to improve the service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">What we don&apos;t do</h2>
              <ul className="space-y-2">
                <li>• We don&apos;t sell your data to anyone</li>
                <li>• We don&apos;t track you across other websites</li>
                <li>• We don&apos;t send marketing emails unless you opt in</li>
                <li>• We don&apos;t share your information with third parties</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Public information</h2>
              <p>
                LinkyLink pages are public by default. Anyone with your LinkyLink URL can see your links and titles. 
                Don&apos;t include sensitive information in your public links.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Data security</h2>
              <p>
                We use industry-standard security measures to protect your data. Your password is encrypted, 
                and we use secure connections for all data transmission.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Account deletion</h2>
              <p>
                You can delete your account anytime. This removes all your data from our servers. 
                Your LinkyLink pages will no longer be accessible.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Changes to this policy</h2>
              <p>
                If we update this privacy policy, we&apos;ll notify users via email and update the date below.
              </p>
            </div>

            <div className="pt-8 border-t text-sm text-gray-500">
              <p>Last updated: August 26, 2024</p>
              <p className="mt-2">
                Questions? Contact us at privacy@linkylink.com
              </p>
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