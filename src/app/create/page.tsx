"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Link2, Plus, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createLinkylink, addLinkToLinkylink } from "@/lib/actions"
import { useSession } from "next-auth/react"

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  subtitle: z.string().max(200, "Subtitle is too long").optional(),
  avatar: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
})

type CreateFormData = z.infer<typeof createSchema>

interface CreatedLinkyLink {
  id: string
  title: string
  subtitle?: string | null
  slug: string
  user: {
    username: string
  }
}

export default function CreatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<'info' | 'links'>('info')
  const [createdLinkylink, setCreatedLinkylink] = useState<CreatedLinkyLink | null>(null)
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkContext, setLinkContext] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      avatar: "",
    },
  })

  // Redirect to login if not authenticated
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  }

  if (!session) {
    router.push("/login?callbackUrl=/create")
    return null
  }


  const normalizeUrl = (input: string): string => {
    if (!input.trim()) return input
    
    let url = input.trim()
    
    // If it already has a protocol, return as is
    if (url.match(/^https?:\/\//)) {
      return url
    }
    
    // Add https:// prefix
    url = `https://${url}`
    
    return url
  }

  const extractTitleFromUrl = (url: string): string => {
    if (!url) return ""
    
    // Normalize the URL before processing
    const normalizedUrl = normalizeUrl(url)
    
    try {
      const urlObj = new URL(normalizedUrl)
      const pathname = urlObj.pathname
      
      // Extract the last segment of the path, remove file extensions, and clean it up
      const segments = pathname.split('/').filter(Boolean)
      const lastSegment = segments[segments.length - 1] || urlObj.hostname
      
      // Remove common file extensions and clean up
      const cleanSegment = lastSegment
        .replace(/\.[a-zA-Z0-9]+$/, '') // Remove file extensions
        .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between camelCase
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
        .join(' ')
        .trim()
      
      return cleanSegment || urlObj.hostname
    } catch {
      return ""
    }
  }


  const onInfoSubmit = async (data: CreateFormData) => {
    setIsLoading(true)
    setError("")

    try {
      // Clean up avatar field - convert empty string to undefined
      const cleanedData = {
        ...data,
        avatar: data.avatar?.trim() || undefined
      }
      const linkylink = await createLinkylink(cleanedData)
      setCreatedLinkylink(linkylink)
      setStep('links')
    } catch {
      setError("Failed to create LinkyLink. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onAddFirstLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim() || !createdLinkylink) return

    const normalizedUrl = normalizeUrl(linkUrl.trim())
    
    setIsLoading(true)
    try {
      await addLinkToLinkylink(createdLinkylink.id, {
        title: linkTitle.trim(),
        url: normalizedUrl,
        context: linkContext.trim() || undefined,
        order: 0
      })
      
      router.push(`/${createdLinkylink.user.username}/${createdLinkylink.slug}?edit=true`)
    } catch {
      setError("Failed to add link. Please try again.")
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
              <span className="font-medium">LinkyLink</span>
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
            <div className="mb-8">
              {step === 'info' ? (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create LinkyLink</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Start by giving your collection a name and subtitle</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add Your First Link</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Your LinkyLink is ready! Add your first link to get started</p>
                </>
              )}
            </div>

            {step === 'info' ? (
              <form onSubmit={handleSubmit(onInfoSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    {...register("title")}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="My Awesome Links"
                    disabled={isLoading}
                    autoFocus
                  />
                  {errors.title && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subtitle (optional)
                  </label>
                  <textarea
                    {...register("subtitle")}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="A collection of my favorite resources"
                    rows={3}
                    disabled={isLoading}
                  />
                  {errors.subtitle && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.subtitle.message}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating LinkyLink...
                      </>
                    ) : (
                      "Continue →"
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
            ) : (
              <div className="space-y-6">
                {/* LinkyLink Preview */}
                {createdLinkylink && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {createdLinkylink.title}
                      </h2>
                      {createdLinkylink.subtitle && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{createdLinkylink.subtitle}</p>
                      )}
                      <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                        <Link2 className="w-4 h-4" />
                        linkylink.co/{createdLinkylink.user.username}/{createdLinkylink.slug}
                      </div>
                    </div>
                  </div>
                )}

                {/* Add First Link */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Your First Link</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Link URL *
                    </label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => {
                        const rawInput = e.target.value
                        setLinkUrl(rawInput)
                        
                        // Auto-generate title from URL if title is empty
                        if (!linkTitle.trim() && rawInput.trim()) {
                          const suggestedTitle = extractTitleFromUrl(rawInput)
                          setLinkTitle(suggestedTitle)
                        }
                      }}
                      onBlur={(e) => {
                        // Normalize URL when user leaves the field
                        const rawInput = e.target.value
                        if (rawInput.trim()) {
                          const normalized = normalizeUrl(rawInput)
                          setLinkUrl(normalized)
                        }
                      }}
                      placeholder="example.com or https://example.com"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Link Title *
                    </label>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Link title (e.g., My YouTube Channel)"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && linkTitle.trim() && linkUrl.trim()) {
                          e.preventDefault()
                          onAddFirstLink()
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={linkContext}
                      onChange={(e) => {
                        if (e.target.value.length <= 280) {
                          setLinkContext(e.target.value)
                        }
                      }}
                      placeholder="Add context or description (optional, 280 chars)"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={isLoading}
                      rows={2}
                    />
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                      {linkContext.length}/280
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={onAddFirstLink}
                    disabled={!linkTitle.trim() || !linkUrl.trim() || isLoading}
                    className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding Link...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add First Link
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/${createdLinkylink?.user.username}/${createdLinkylink?.slug}?edit=true`)}
                    className="w-full px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    disabled={isLoading}
                  >
                    Skip for now - Go to LinkyLink
                  </button>
                </div>
              </div>
            )}

            {/* Tips */}
            {step === 'info' && (
              <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">What&apos;s next?</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                    <span>After creating your LinkyLink, you&apos;ll see a preview of how it looks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                    <span>You can add your first link right away or skip and add links later</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                    <span>You&apos;ll be able to edit everything and add more links anytime</span>
                  </li>
                </ul>
              </div>
            )}
            
            {step === 'links' && (
              <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tips:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 dark:text-blue-300 mt-0.5">•</span>
                    <span>Use clear titles that tell people what they&apos;ll find when they click</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 dark:text-blue-300 mt-0.5">•</span>
                    <span>Press Enter in the title field to quickly add your link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 dark:text-blue-300 mt-0.5">•</span>
                    <span>You can always add more links and customize everything later</span>
                  </li>
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}