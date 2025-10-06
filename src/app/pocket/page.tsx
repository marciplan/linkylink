"use client"

import { useState, FormEvent, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Link2, Upload, ArrowLeft, FileText, CheckCircle2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession } from "next-auth/react"

export default function PocketImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [importComplete, setImportComplete] = useState(false)
  const [importedBundel, setImportedBundel] = useState<{ username: string; slug: string } | null>(null)

  // Redirect to login if not authenticated
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  }

  if (!session) {
    router.push("/login?callbackUrl=/pocket")
    return null
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Please select a CSV file")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a file to import")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import-pocket', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import')
      }

      setImportComplete(true)
      setImportedBundel(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import Pocket data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Link2 className="w-5 h-5" />
              <span className="font-medium">Bundel</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {!importComplete ? (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Import from Pocket</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Import your saved links from Pocket into a new Bundel</p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">How to export from Pocket:</h3>
                  <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">1.</span>
                      <span>Go to <a href="https://getpocket.com/export" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300">getpocket.com/export</a> and request an export</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">2.</span>
                      <span>Check your email for a message from Pocket with the download link</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">3.</span>
                      <span>Download the CSV file from the email link</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">4.</span>
                      <span>Upload the downloaded CSV file below</span>
                    </li>
                  </ol>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select CSV File
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`w-full flex items-center justify-center gap-3 px-6 py-12 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                          file
                            ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        {file ? (
                          <>
                            <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to change file</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Click to upload CSV</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">or drag and drop</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={!file || isLoading}
                      className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import from Pocket
                        </>
                      )}
                    </button>
                    <Link
                      href="/dashboard"
                      className="w-full px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center block"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>

                {/* Info */}
                <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                      <span>Your Pocket links will be imported into a new Bundel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                      <span>The Bundel will be titled &quot;My Pocket Links&quot;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                      <span>A random background and emoji will be generated automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                      <span>You can edit everything after import</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </motion.div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Import Complete!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Your Pocket links have been successfully imported</p>

                {importedBundel && (
                  <div className="space-y-3">
                    <Link
                      href={`/${importedBundel.username}/${importedBundel.slug}?edit=true`}
                      className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      View & Edit Bundel
                    </Link>
                    <div className="block">
                      <Link
                        href="/dashboard"
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
