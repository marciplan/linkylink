"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Link2, Plus, Trash2 } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createLinkylink, addLinkToLinkylink } from "@/lib/actions"
import { useSession } from "next-auth/react"
import { Avatar } from "@/components/Avatar"

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  subtitle: z.string().max(200, "Subtitle is too long").optional(),
  avatar: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
})

type CreateFormData = z.infer<typeof createSchema>

interface LinkItem {
  id: string
  title: string
  url: string
}

export default function CreatePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [links, setLinks] = useState<LinkItem[]>([])
  const [linkTitle, setLinkTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
  })

  const watchedAvatar = watch("avatar")
  const watchedTitle = watch("title")

  const addLinkToList = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return
    
    const newLink: LinkItem = {
      id: Date.now().toString(),
      title: linkTitle.trim(),
      url: linkUrl.trim()
    }
    
    setLinks(prev => [...prev, newLink])
    setLinkTitle("")
    setLinkUrl("")
  }

  const removeLinkFromList = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id))
  }

  const onSubmit = async (data: CreateFormData) => {
    setIsLoading(true)
    setError("")

    try {
      // Clean up avatar field - convert empty string to undefined
      const cleanedData = {
        ...data,
        avatar: data.avatar?.trim() || undefined
      }
      const linkylink = await createLinkylink(cleanedData)
      
      // Add all links to the created LinkyLink
      for (let i = 0; i < links.length; i++) {
        const link = links[i]
        await addLinkToLinkylink(linkylink.id, {
          title: link.title,
          url: link.url,
          order: i
        })
      }
      
      if (session) {
        router.push(`/edit/${linkylink.id}`)
      } else {
        router.push(`/${linkylink.user.username}/${linkylink.slug}`)
      }
    } catch {
      setError("Failed to create LinkyLink. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to dashboard
            </Link>
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
              <h1 className="text-2xl font-semibold text-gray-900">Create LinkyLink</h1>
              <p className="text-gray-600 mt-2">Give your collection a name and add your links</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  {...register("title")}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors text-lg"
                  placeholder="My Awesome Links"
                  disabled={isLoading}
                  autoFocus
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle (optional)
                </label>
                <textarea
                  {...register("subtitle")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors resize-none"
                  placeholder="A collection of my favorite resources"
                  rows={3}
                  disabled={isLoading}
                />
                {errors.subtitle && (
                  <p className="text-red-600 text-sm mt-1">{errors.subtitle.message}</p>
                )}
              </div>

              {/* Avatar Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar (optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Avatar 
                      src={watchedAvatar || session?.user?.image}
                      username={session?.user?.username || watchedTitle || "User"}
                      size={60}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      {...register("avatar")}
                      type="url"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
                      placeholder="https://example.com/your-photo.jpg"
                      disabled={isLoading}
                    />
                    {errors.avatar && (
                      <p className="text-red-600 text-sm mt-1">{errors.avatar.message}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {session?.user?.image ? "Override your profile photo for this LinkyLink" : "Add a custom photo or we'll use a colorful gradient"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Links Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Links</h3>
                
                {/* Link Input */}
                <div className="space-y-3 mb-4">
                  <div>
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Link title (e.g., My YouTube Channel)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addLinkToList()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addLinkToList}
                      disabled={!linkTitle.trim() || !linkUrl.trim() || isLoading}
                      className="px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Notification */}
                {!session && (
                  <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm border border-blue-200 mb-4">
                    <p><strong>Note:</strong> You can create this LinkyLink without an account. To edit links later, <Link href="/register" className="underline">create an account</Link>.</p>
                  </div>
                )}

                {session && (
                  <div className="bg-gray-50 text-gray-600 px-4 py-3 rounded-lg text-sm border border-gray-200 mb-4">
                    <p>You can add more links and edit them anytime after creating your LinkyLink.</p>
                  </div>
                )}

                {/* Divider */}
                {links.length > 0 && <div className="border-t my-4"></div>}

                {/* Added Links */}
                {links.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Added Links</h4>
                    <div className="space-y-2">
                      {links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm">{link.title}</div>
                            <div className="text-xs text-gray-500 truncate max-w-full">{link.url}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLinkFromList(link.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider before buttons */}
              <div className="border-t my-6"></div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  href="/dashboard"
                  className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    links.length > 0 ? "Create LinkyLink" : "Create & Add Links Later"
                  )}
                </button>
              </div>
            </form>

            {/* Tips */}
            <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Tips:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Add links now to save time, or create first and add them later</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Use clear titles that tell people what they&apos;ll find when they click</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Press Enter in the URL field to quickly add links</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}