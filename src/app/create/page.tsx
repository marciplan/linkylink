"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Link2 } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createLinkylink } from "@/lib/actions"

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  subtitle: z.string().max(200, "Subtitle is too long").optional(),
})

type CreateFormData = z.infer<typeof createSchema>

export default function CreatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
  })

  const onSubmit = async (data: CreateFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const linkylink = await createLinkylink(data)
      router.push(`/edit/${linkylink.id}`)
    } catch (error) {
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
              <p className="text-gray-600 mt-2">Give your link collection a name</p>
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

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-200">
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
                    "Create & Add Links"
                  )}
                </button>
              </div>
            </form>

            {/* Tips */}
            <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Tips for a great LinkyLink:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Use a clear, descriptive title that tells visitors what links they'll find</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Add a subtitle to provide more context about your collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>You can add, edit, and reorder links after creating your LinkyLink</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}