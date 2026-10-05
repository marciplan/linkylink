import Link from "next/link"
import { Link2 } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh flex flex-col pt-safe">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              <span className="font-medium">Bundel</span>
            </Link>
            <nav>
              <div className="flex items-center gap-6">
                <Link
                  href="/register"
                  className="text-sm bg-ink text-bg font-semibold px-4 py-2 rounded-full hover:bg-ink/90 transition-colors"
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
          <h1 className="text-display mb-8">
            Privacy Policy
          </h1>

          <div className="space-y-8 text-ink-2">
            <div>
              <h2 className="text-xl font-medium text-ink mb-4">What we collect</h2>
              <p className="mb-4">
                We collect minimal information to make Bundel work:
              </p>
              <ul className="space-y-2">
                <li>• Email address and username when you create an account</li>
                <li>• Links and titles you add to your Bundel pages</li>
                <li>• Basic usage analytics to improve the service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-medium text-ink mb-4">What we don&apos;t do</h2>
              <ul className="space-y-2">
                <li>• We don&apos;t sell your data to anyone</li>
                <li>• We don&apos;t track you across other websites</li>
                <li>• We don&apos;t send marketing emails unless you opt in</li>
                <li>• We don&apos;t share your information with third parties, apart from the email provider described below</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-medium text-ink mb-4">Public information</h2>
              <p>
                Bundel pages are public by default. Anyone with your Bundel URL can see your links and titles. 
                Don&apos;t include sensitive information in your public links.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-ink mb-4">Votes, suggestions and follows</h2>
              <ul className="space-y-2">
                <li>• When you vote on or suggest a link for a Bundel without an account, we store the name you type and a random code saved on your device. The Bundel&apos;s owner and its visitors see your name next to your vote.</li>
                <li>• If you follow someone by email, we store your email address only after you confirm it, and send at most one email a day when they add links. Every email has an unsubscribe link, and unsubscribing deletes your address. The curator is told someone followed, never who.</li>
                <li>• Emails are delivered by our email provider, which processes your address only to send them.</li>
                <li>• RSS feeds contain only what is already public on Bundel pages.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-medium text-ink mb-4">Data security</h2>
              <p>
                We use industry-standard security measures to protect your data. Your password is encrypted, 
                and we use secure connections for all data transmission.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-ink mb-4">Account deletion</h2>
              <p>
                You can delete your account anytime. This removes all your data from our servers. 
                Your Bundel pages will no longer be accessible.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-ink mb-4">Changes to this policy</h2>
              <p>
                If we update this privacy policy, we&apos;ll notify users via email and update the date below.
              </p>
            </div>

            <div className="pt-8 border-t text-sm text-ink-3">
              <p>Last updated: October 5, 2026</p>
              <p className="mt-2">
                Questions? Contact us at privacy@bundel.link
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-ink-3">
              © 2024 Bundel
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="text-sm text-ink-3 hover:text-ink">
                About
              </Link>
              <Link href="/privacy" className="text-sm text-ink-3 hover:text-ink">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
