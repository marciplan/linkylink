"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Link2, ArrowLeft, Plus, ThumbsUp, ThumbsDown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { CategoryIconPicker, CategoryIcon, suggestIcon, type CategoryIconName } from "@/components/CategoryIconPicker"
import { createYearReview, addCategory, addCategoryItem } from "@/lib/actions"
import { useSession } from "next-auth/react"

interface CreatedYearReview {
  id: string
  title: string
  subtitle?: string | null
  slug: string
  year: number
  user: {
    username: string
  }
}

interface CreatedCategory {
  id: string
  name: string
  categoryType: "BEST" | "WORST"
  rankLimit: number
}

export default function CreateYearReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<'info' | 'category' | 'items'>('info')

  // Year Review data
  const [year, setYear] = useState(new Date().getFullYear())
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [createdYearReview, setCreatedYearReview] = useState<CreatedYearReview | null>(null)

  // Category data
  const [categoryName, setCategoryName] = useState("")
  const [categoryIcon, setCategoryIcon] = useState<CategoryIconName>("Star")
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [categoryType, setCategoryType] = useState<"BEST" | "WORST">("BEST")
  const [rankLimit, setRankLimit] = useState(5)
  const [createdCategory, setCreatedCategory] = useState<CreatedCategory | null>(null)

  // Item data
  const [itemTitle, setItemTitle] = useState("")
  const [itemUrl, setItemUrl] = useState("")
  const [itemContext, setItemContext] = useState("")
  const [addedItems, setAddedItems] = useState<{ title: string; rank: number }[]>([])

  // Generate year options (current year down to 2015)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: currentYear - 2014 }, (_, i) => currentYear - i)

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  }

  if (!session) {
    router.push("/login?callbackUrl=/create/year-review")
    return null
  }

  const normalizeUrl = (input: string): string => {
    if (!input.trim()) return input
    const url = input.trim()
    if (url.match(/^https?:\/\//)) return url
    return `https://${url}`
  }

  const extractTitleFromUrl = (url: string): string => {
    if (!url) return ""
    const normalizedUrl = normalizeUrl(url)
    try {
      const urlObj = new URL(normalizedUrl)
      const pathname = urlObj.pathname
      const segments = pathname.split('/').filter(Boolean)
      const lastSegment = segments[segments.length - 1] || urlObj.hostname
      const cleanSegment = lastSegment
        .replace(/\.[a-zA-Z0-9]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim()
      return cleanSegment || urlObj.hostname
    } catch {
      return ""
    }
  }

  const onInfoSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const yearReview = await createYearReview({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        year,
      })
      setCreatedYearReview(yearReview as CreatedYearReview)
      setStep('category')
    } catch {
      setError("Failed to create Year Review. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onCategorySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!categoryName.trim() || !createdYearReview) {
      setError("Category name is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const category = await addCategory({
        linkylinkId: createdYearReview.id,
        name: categoryName.trim(),
        icon: categoryIcon,
        categoryType,
        rankLimit,
      })
      setCreatedCategory(category as CreatedCategory)
      setStep('items')
    } catch {
      setError("Failed to add category. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onAddItem = async () => {
    if (!itemTitle.trim() || !itemUrl.trim() || !createdCategory) return

    const normalizedUrl = normalizeUrl(itemUrl.trim())

    setIsLoading(true)
    setError("")

    try {
      await addCategoryItem({
        categoryId: createdCategory.id,
        title: itemTitle.trim(),
        url: normalizedUrl,
        context: itemContext.trim() || undefined,
      })

      setAddedItems([...addedItems, { title: itemTitle.trim(), rank: addedItems.length + 1 }])
      setItemTitle("")
      setItemUrl("")
      setItemContext("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add item"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const onFinish = () => {
    if (createdYearReview) {
      router.push(`/${createdYearReview.user.username}/${createdYearReview.slug}?edit=true`)
    }
  }

  const getCategoryHeading = () => {
    if (!createdCategory) return ""
    const type = createdCategory.categoryType === "BEST" ? "Best" : "Worst"
    return `${type} ${createdCategory.rankLimit} ${createdCategory.name} of the Year`
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
                href="/create"
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
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
            {/* Step Indicator with Labels */}
            <nav aria-label="Progress" className="mb-8">
              <ol className="flex items-center justify-center gap-2">
                <li className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step === 'info' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                    aria-current={step === 'info' ? 'step' : undefined}
                  >
                    1
                  </div>
                  <span className={`mt-1 text-xs ${step === 'info' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    Year Info
                  </span>
                </li>
                <li className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700 mt-[-16px]" aria-hidden="true" />
                <li className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step === 'category' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                    aria-current={step === 'category' ? 'step' : undefined}
                  >
                    2
                  </div>
                  <span className={`mt-1 text-xs ${step === 'category' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    Category
                  </span>
                </li>
                <li className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700 mt-[-16px]" aria-hidden="true" />
                <li className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step === 'items' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                    aria-current={step === 'items' ? 'step' : undefined}
                  >
                    3
                  </div>
                  <span className={`mt-1 text-xs ${step === 'items' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    Add Items
                  </span>
                </li>
              </ol>
            </nav>

            <div className="mb-8">
              {step === 'info' && (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Year Review</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Start by selecting the year and giving your review a title</p>
                </>
              )}
              {step === 'category' && (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add First Category</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Create your first ranked list category</p>
                </>
              )}
              {step === 'items' && (
                <>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{getCategoryHeading()}</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Add items to your ranked list ({addedItems.length}/{createdCategory?.rankLimit})</p>
                </>
              )}
            </div>

            {/* Step 1: Info */}
            {step === 'info' && (
              <form onSubmit={onInfoSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={isLoading}
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={`My ${year} Year Review`}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subtitle (optional)
                  </label>
                  <textarea
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="The best and worst of the year"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading || !title.trim()}
                    className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Continue →"
                    )}
                  </button>
                  <Link
                    href="/create"
                    className="w-full px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center block"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            )}

            {/* Step 2: Category */}
            {step === 'category' && (
              <form onSubmit={onCategorySubmit} className="space-y-6">
                {/* Year Review Preview */}
                {createdYearReview && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-medium">
                        {createdYearReview.year}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{createdYearReview.title}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value)
                      // Auto-suggest icon based on category name
                      const suggestedIcon = suggestIcon(e.target.value)
                      setCategoryIcon(suggestedIcon)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="e.g., Websites, Coffee Brands, Vacation Spots"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Icon
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="flex items-center gap-3 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <CategoryIcon icon={categoryIcon} className="w-5 h-5" />
                    </div>
                    <span className="flex-1 text-left">{categoryIcon}</span>
                    <span className="text-sm text-gray-400">Click to change</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCategoryType("BEST")}
                      className={`flex-1 p-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                        categoryType === "BEST"
                          ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${categoryType === "BEST" ? "text-gray-900 dark:text-white" : "text-gray-400"}`} />
                      <span className={`font-medium ${categoryType === "BEST" ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>Best</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryType("WORST")}
                      className={`flex-1 p-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                        categoryType === "WORST"
                          ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <ThumbsDown className={`w-5 h-5 ${categoryType === "WORST" ? "text-gray-900 dark:text-white" : "text-gray-400"}`} />
                      <span className={`font-medium ${categoryType === "WORST" ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>Worst</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rank Limit
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRankLimit(5)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                        rankLimit === 5
                          ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <span className={`font-medium ${rankLimit === 5 ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>Top 5</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRankLimit(10)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                        rankLimit === 10
                          ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <span className={`font-medium ${rankLimit === 10 ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>Top 10</span>
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {categoryName.trim() && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Preview:</p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {categoryType === "BEST" ? "Best" : "Worst"} {rankLimit} {categoryName} of the Year
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading || !categoryName.trim()}
                    className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Continue →"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Items */}
            {step === 'items' && createdCategory && (
              <div className="space-y-6">
                {/* Added Items List */}
                {addedItems.length > 0 && (
                  <div className="space-y-2">
                    {addedItems.map((item) => (
                      <div
                        key={item.rank}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          item.rank === 1 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          item.rank === 2 ? "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300" :
                          item.rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          {item.rank}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">{item.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Item Form */}
                {addedItems.length < createdCategory.rankLimit && (
                  <div className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                        {addedItems.length + 1}
                      </div>
                      <span>Add item #{addedItems.length + 1}</span>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={itemUrl}
                        onChange={(e) => {
                          setItemUrl(e.target.value)
                          if (!itemTitle.trim() && e.target.value.trim()) {
                            setItemTitle(extractTitleFromUrl(e.target.value))
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            setItemUrl(normalizeUrl(e.target.value))
                          }
                        }}
                        placeholder="URL (e.g., example.com)"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && itemTitle.trim() && itemUrl.trim()) {
                            e.preventDefault()
                            onAddItem()
                          }
                        }}
                      />
                    </div>

                    <div>
                      <textarea
                        value={itemContext}
                        onChange={(e) => {
                          if (e.target.value.length <= 280) {
                            setItemContext(e.target.value)
                          }
                        }}
                        placeholder="Description (optional)"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        rows={2}
                        disabled={isLoading}
                      />
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                        {itemContext.length}/280
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onAddItem}
                      disabled={!itemTitle.trim() || !itemUrl.trim() || isLoading}
                      className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add Item
                        </>
                      )}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <button
                    type="button"
                    onClick={onFinish}
                    className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    {addedItems.length === 0 ? "Skip & Continue to Edit" : "Continue to Edit →"}
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    You can add more categories and items later
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Icon Picker */}
      <CategoryIconPicker
        selectedIcon={categoryIcon}
        onSelect={(icon) => setCategoryIcon(icon)}
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
      />
    </div>
  )
}
