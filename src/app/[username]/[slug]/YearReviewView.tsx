"use client"

import { useState, useEffect } from "react"
import { motion, Reorder, useDragControls } from "framer-motion"
import { Eye, Edit2, Save, Trash2, Copy, Check, GripVertical, Share, AtSign, Settings, Link2, Plus, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Avatar } from "@/components/Avatar"
import { DeleteModal } from "@/components/DeleteModal"
import { VisualHeader } from "@/components/VisualHeader"
import { TweakModal } from "@/components/TweakModal"
import { CategoryIconPicker, CategoryIcon, suggestIcon, type CategoryIconName } from "@/components/CategoryIconPicker"
import {
  updateLinkylink,
  deleteLinkylink,
  addCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
  addCategoryItem,
  updateItemRank,
  deleteCategoryItem,
  incrementCategoryItemClicks,
  incrementCategoryItemLikes
} from "@/lib/actions"

interface CategoryItem {
  id: string
  title: string
  url: string
  favicon: string | null
  context: string | null
  rank: number
  clicks: number
  likes: number
}

interface Category {
  id: string
  name: string
  icon: string
  categoryType: "BEST" | "WORST"
  order: number
  rankLimit: number
  items: CategoryItem[]
}

interface YearReviewViewProps {
  linkylink: {
    id: string
    title: string
    subtitle: string | null
    avatar: string | null
    headerImage?: string | null
    headerPrompt?: string | null
    headerImages?: string[]
    views: number
    createdAt: Date
    year?: number | null
    user: {
      username: string
      name: string | null
      image: string | null
    }
    categories: Category[]
  }
  isOwner?: boolean
}

function DraggableItem({
  item,
  onDelete,
  isEditing
}: {
  item: CategoryItem
  onDelete: (id: string) => void
  isEditing: boolean
}) {
  const controls = useDragControls()
  const [likes, setLikes] = useState(item.likes)

  const handleClick = () => {
    if (isEditing) return
    incrementCategoryItemClicks(item.id)
    window.open(item.url, "_blank", "noopener,noreferrer")
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newLikes = await incrementCategoryItemLikes(item.id)
    setLikes(newLikes)
  }

  const domain = (() => {
    try { return new URL(item.url).hostname.replace('www.', '') } catch { return '' }
  })()

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    if (rank === 2) return "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
    if (rank === 3) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
  }

  if (isEditing) {
    return (
      <Reorder.Item
        value={item}
        id={item.id}
        dragListener={false}
        dragControls={controls}
        className="relative"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all">
          <div className="flex items-center gap-3">
            <div
              onPointerDown={(e) => controls.start(e)}
              className="text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing touch-none min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-5 h-5" />
            </div>

            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankBadgeStyle(item.rank)}`}>
              {item.rank}
            </div>

            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600">
              <Image
                src={item.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
                unoptimized
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{domain}</p>
            </div>

            <button
              onClick={() => onDelete(item.id)}
              className="p-3 min-w-[44px] min-h-[44px] rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center"
              aria-label={`Delete ${item.title}`}
            >
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          </div>

          {/* Show context/comment in edit mode */}
          {item.context && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 pl-[54px] line-clamp-2 italic">
              &ldquo;{item.context}&rdquo;
            </p>
          )}
        </div>
      </Reorder.Item>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
      onClick={handleClick}
      role="article"
      aria-label={`Rank ${item.rank}: ${item.title}`}
    >
      <div className="flex items-center gap-3">
        {/* Larger touch target for rank badge */}
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${getRankBadgeStyle(item.rank)}`}>
          {item.rank}
        </div>

        <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600">
          <Image
            src={item.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
            unoptimized
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{item.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{domain}</p>
        </div>

        <div className="flex items-center gap-1">
          {/* Larger touch target for like button (44x44 minimum) */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1 px-3 py-2 min-h-[44px] text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={`Like ${item.title}, currently ${likes} likes`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{likes}</span>
          </button>
          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
        </div>
      </div>

      {item.context && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-[56px]">{item.context}</p>
      )}
    </motion.div>
  )
}

export default function YearReviewView({ linkylink, isOwner = false }: YearReviewViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(linkylink.title)
  const [subtitle, setSubtitle] = useState(linkylink.subtitle || "")
  const [categories, setCategories] = useState(linkylink.categories)
  const [activeCategory, setActiveCategory] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTweakModal, setShowTweakModal] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  // Add category form
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState<CategoryIconName>("Star")
  const [newCategoryType, setNewCategoryType] = useState<"BEST" | "WORST">("BEST")
  const [newRankLimit, setNewRankLimit] = useState(5)
  const [showIconPicker, setShowIconPicker] = useState(false)

  // Edit category icon
  const [editingCategoryIcon, setEditingCategoryIcon] = useState<string | null>(null)

  // Add item form
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemUrl, setNewItemUrl] = useState("")
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemContext, setNewItemContext] = useState("")
  const [addItemError, setAddItemError] = useState("")

  useEffect(() => {
    setCurrentUrl(window.location.href)
    if (isOwner && searchParams.get('edit') === 'true') {
      setIsEditing(true)
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('edit')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [isOwner, searchParams])

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(currentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: title,
          text: subtitle || `Check out ${title}`,
          url: currentUrl
        })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          handleCopyUrl()
        }
      }
    } else {
      handleCopyUrl()
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateLinkylink(linkylink.id, {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined
      })
      linkylink.title = title.trim()
      linkylink.subtitle = subtitle.trim() || null
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle(linkylink.title)
    setSubtitle(linkylink.subtitle || "")
    setCategories(linkylink.categories)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await deleteLinkylink(linkylink.id)
    router.push('/dashboard')
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const category = await addCategory({
        linkylinkId: linkylink.id,
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        categoryType: newCategoryType,
        rankLimit: newRankLimit
      })
      setCategories([...categories, { ...category, items: [] }])
      setActiveCategory(categories.length)
      setNewCategoryName("")
      setNewCategoryIcon("Star")
      setNewCategoryType("BEST")
      setNewRankLimit(5)
      setShowAddCategory(false)
    } catch (error) {
      console.error('Failed to add category:', error)
    }
  }

  const handleUpdateCategoryIcon = async (categoryId: string, icon: CategoryIconName) => {
    try {
      await updateCategory(categoryId, { icon })
      setCategories(categories.map(cat =>
        cat.id === categoryId ? { ...cat, icon } : cat
      ))
      setEditingCategoryIcon(null)
    } catch (error) {
      console.error('Failed to update category icon:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId)
      const newCategories = categories.filter(c => c.id !== categoryId)
      setCategories(newCategories)
      if (activeCategory >= newCategories.length) {
        setActiveCategory(Math.max(0, newCategories.length - 1))
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const handleReorderCategories = (newCategories: Category[]) => {
    setCategories(newCategories)
    // Update the order in the database
    updateCategoryOrder(linkylink.id, newCategories.map(c => c.id)).catch(error => {
      console.error('Failed to update category order:', error)
    })
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

  const handleAddItem = async () => {
    const currentCategory = categories[activeCategory]
    if (!currentCategory || !newItemTitle.trim() || !newItemUrl.trim()) return

    if (currentCategory.items.length >= currentCategory.rankLimit) {
      setAddItemError(`This category is full (${currentCategory.rankLimit} items max)`)
      return
    }

    setAddItemError("")

    try {
      const item = await addCategoryItem({
        categoryId: currentCategory.id,
        title: newItemTitle.trim(),
        url: normalizeUrl(newItemUrl.trim()),
        context: newItemContext.trim() || undefined
      })

      const updatedCategories = categories.map((cat, idx) => {
        if (idx === activeCategory) {
          return { ...cat, items: [...cat.items, item] }
        }
        return cat
      })
      setCategories(updatedCategories)
      setNewItemUrl("")
      setNewItemTitle("")
      setNewItemContext("")
      setAddItemError("")
      setShowAddItem(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add item'
      setAddItemError(message)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteCategoryItem(itemId)
      const updatedCategories = categories.map((cat, idx) => {
        if (idx === activeCategory) {
          return {
            ...cat,
            items: cat.items
              .filter(i => i.id !== itemId)
              .map((i, index) => ({ ...i, rank: index + 1 }))
          }
        }
        return cat
      })
      setCategories(updatedCategories)
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const handleReorderItems = (newItems: CategoryItem[]) => {
    const currentCategory = categories[activeCategory]
    if (!currentCategory) return

    const updatedItems = newItems.map((item, index) => ({ ...item, rank: index + 1 }))
    const updatedCategories = categories.map((cat, idx) => {
      if (idx === activeCategory) {
        return { ...cat, items: updatedItems }
      }
      return cat
    })
    setCategories(updatedCategories)

    updateItemRank(currentCategory.id, newItems.map(i => i.id)).catch(error => {
      console.error('Failed to update item rank:', error)
    })
  }

  const handleTweakSave = async (updates: { avatar?: string | null, headerImage?: string | null }) => {
    if (updates.avatar !== undefined) {
      await updateLinkylink(linkylink.id, {
        avatar: updates.avatar || undefined
      })
      linkylink.avatar = updates.avatar
    }
    if (updates.headerImage !== undefined) {
      linkylink.headerImage = updates.headerImage
    }
  }

  // Hide empty categories from public view (but show all in edit mode)
  const visibleCategories = isEditing
    ? categories
    : categories.filter(cat => cat.items.length > 0)

  const currentCategory = visibleCategories[activeCategory]
  const getCategoryHeading = (cat: Category) => {
    const type = cat.categoryType === "BEST" ? "Best" : "Worst"
    return `${type} ${cat.rankLimit} ${cat.name} of the Year`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <VisualHeader
        linkylink={linkylink}
        isOwner={isOwner}
        isEditMode={isEditing}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4 max-w-2xl mx-auto"
        >
          <div className="mb-4 flex justify-center">
            <div className="border-4 border-white/50 shadow-lg rounded-full backdrop-blur-sm">
              <Avatar
                src={linkylink.avatar || linkylink.user.image}
                username={linkylink.user.username}
                title={linkylink.title}
                size={80}
              />
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-semibold text-center bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg px-4 py-2 focus:border-white/70 focus:bg-white/70 focus:outline-none text-gray-900 placeholder-gray-500"
                placeholder="Year Review Title"
                disabled={isSaving}
              />
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full text-gray-700 text-center bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg px-4 py-2 focus:border-white/70 focus:bg-white/70 focus:outline-none placeholder-gray-500"
                placeholder="Add a subtitle (optional)"
                disabled={isSaving}
              />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{title}</h1>
              {subtitle && (
                <p className="text-white/90 text-lg drop-shadow-md">{subtitle}</p>
              )}
            </>
          )}

          {!isEditing && (
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-white/90 drop-shadow-md">
              {linkylink.year && (
                <span className="flex items-center gap-1 bg-white/30 px-4 py-1.5 rounded-full backdrop-blur-sm font-semibold">
                  {linkylink.year}
                </span>
              )}
              <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <AtSign className="w-3.5 h-3.5" />
                {linkylink.user.username}
              </span>
              <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Eye className="w-3.5 h-3.5" />
                {linkylink.views.toLocaleString()}
              </span>
            </div>
          )}
        </motion.div>
      </VisualHeader>

      {/* Header controls */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href={isOwner ? "/dashboard" : "/"}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <Link2 className="w-4 h-4" />
          Bundel
        </Link>
      </div>

      {isOwner && isEditing && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowTweakModal(true)}
            className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold flex items-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Tweak
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Category Tabs with gradient fade indicators */}
        {visibleCategories.length > 0 && (
          <nav aria-label="Categories" className="mb-6">
            <div className="relative">
              {/* Gradient fade indicators for overflow */}
              <div className="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent pointer-events-none z-10 opacity-0 transition-opacity" id="scroll-left-fade" />
              <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none z-10" id="scroll-right-fade" />

              <div
                className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                role="tablist"
                aria-label="Category tabs"
              >
                {visibleCategories.map((cat, idx) => (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={activeCategory === idx}
                    aria-controls={`category-panel-${cat.id}`}
                    onClick={() => setActiveCategory(idx)}
                    className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg whitespace-nowrap transition-colors ${
                      activeCategory === idx
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <span
                      onClick={(e) => {
                        if (isEditing) {
                          e.stopPropagation()
                          setEditingCategoryIcon(cat.id)
                        }
                      }}
                      className={isEditing ? "cursor-pointer hover:scale-110 transition-transform" : ""}
                      title={isEditing ? "Click to change icon" : undefined}
                    >
                      <CategoryIcon icon={cat.icon as CategoryIconName} className="w-5 h-5" />
                    </span>
                    <span className="max-w-[120px] truncate">{cat.name}</span>
                  </button>
                ))}
                {isEditing && (
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    aria-label="Add new category"
                  >
                    <Plus className="w-5 h-5" />
                    Add Category
                  </button>
                )}
              </div>
            </div>
          </nav>
        )}

        {/* Empty state - no categories */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No categories added yet</p>
            {isOwner && isEditing && (
              <button
                onClick={() => setShowAddCategory(true)}
                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium"
              >
                Add First Category
              </button>
            )}
          </div>
        )}

        {/* Category Content */}
        {currentCategory && (
          <div className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold ${
                currentCategory.categoryType === "WORST"
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-white"
              }`}>
                {getCategoryHeading(currentCategory)}
              </h2>
              {isEditing && (
                <button
                  onClick={() => handleDeleteCategory(currentCategory.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Items */}
            {currentCategory.items.length === 0 && !isEditing && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                No items in this category yet
              </div>
            )}

            {isEditing && currentCategory.items.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                Drag to reorder
              </p>
            )}

            {isEditing ? (
              <Reorder.Group
                axis="y"
                values={currentCategory.items}
                onReorder={handleReorderItems}
                className="space-y-2"
              >
                {currentCategory.items.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    onDelete={handleDeleteItem}
                    isEditing={isEditing}
                  />
                ))}
              </Reorder.Group>
            ) : (
              <div className="space-y-2">
                {currentCategory.items.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    onDelete={handleDeleteItem}
                    isEditing={false}
                  />
                ))}
              </div>
            )}

            {/* Add Item (edit mode) */}
            {isEditing && currentCategory.items.length < currentCategory.rankLimit && (
              <div className="mt-4">
                {showAddItem ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                        {currentCategory.items.length + 1}
                      </div>
                      <span>Add item #{currentCategory.items.length + 1}</span>
                    </div>
                    <input
                      type="text"
                      value={newItemUrl}
                      onChange={(e) => {
                        setNewItemUrl(e.target.value)
                        if (!newItemTitle.trim() && e.target.value.trim()) {
                          setNewItemTitle(extractTitleFromUrl(e.target.value))
                        }
                      }}
                      placeholder="URL"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <textarea
                      value={newItemContext}
                      onChange={(e) => setNewItemContext(e.target.value)}
                      placeholder="Add a comment (optional) - e.g., why you love it, a fun fact..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                    {addItemError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{addItemError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddItem}
                        disabled={!newItemTitle.trim() || !newItemUrl.trim()}
                        className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddItem(false)
                          setNewItemUrl("")
                          setNewItemTitle("")
                          setNewItemContext("")
                          setAddItemError("")
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Progress indicator */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {currentCategory.items.length} of {currentCategory.rankLimit} items
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">
                        {currentCategory.rankLimit - currentCategory.items.length} remaining
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-300"
                        style={{ width: `${(currentCategory.items.length / currentCategory.rankLimit) * 100}%` }}
                      />
                    </div>
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Item
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Share URL */}
        {!isEditing && currentUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="relative">
              <input
                type="text"
                value={currentUrl}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-white rounded-lg font-mono text-sm text-gray-900 dark:text-white outline-none"
              />
              <button
                onClick={handleCopyUrl}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-md transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}

        {/* Edit Controls */}
        {isOwner && isEditing && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg font-medium border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700" />
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-4 font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Year Review
            </button>
          </div>
        )}

        {/* Owner controls (non-edit mode) */}
        {isOwner && !isEditing && currentUrl && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg p-4 font-medium flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700"
            >
              <Edit2 className="w-5 h-5" />
              Edit Year Review
            </button>
            <button
              onClick={handleShare}
              className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg p-4 font-medium flex items-center justify-center gap-2"
            >
              <Share className="w-5 h-5" />
              Share Year Review
            </button>
          </div>
        )}

        {/* Footer */}
        {!isOwner && (
          <div className="text-center mt-12">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Create your own at{" "}
              <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                bundel.link
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Category</h3>

            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value)
                // Auto-suggest icon based on category name
                const suggestedIcon = suggestIcon(e.target.value)
                setNewCategoryIcon(suggestedIcon)
              }}
              placeholder="Category name (e.g., Websites, Coffee)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />

            {/* Icon Selection */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Category Icon</label>
              <button
                type="button"
                onClick={() => setShowIconPicker(true)}
                className="flex items-center gap-3 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                  <CategoryIcon icon={newCategoryIcon} className="w-5 h-5" />
                </div>
                <span className="flex-1 text-left">{newCategoryIcon}</span>
                <span className="text-sm text-gray-400">Click to change</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setNewCategoryType("BEST")}
                className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                  newCategoryType === "BEST"
                    ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                Best
              </button>
              <button
                onClick={() => setNewCategoryType("WORST")}
                className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                  newCategoryType === "WORST"
                    ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                Worst
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setNewRankLimit(5)}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  newRankLimit === 5
                    ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                Top 5
              </button>
              <button
                onClick={() => setNewRankLimit(10)}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  newRankLimit === 10
                    ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                Top 10
              </button>
            </div>

            {newCategoryName.trim() && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Preview:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {newCategoryType === "BEST" ? "Best" : "Worst"} {newRankLimit} {newCategoryName} of the Year
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium disabled:opacity-50"
              >
                Add Category
              </button>
              <button
                onClick={() => {
                  setShowAddCategory(false)
                  setNewCategoryName("")
                  setNewCategoryIcon("Star")
                  setNewCategoryType("BEST")
                  setNewRankLimit(5)
                }}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Year Review"
        message={`Are you sure you want to delete "${linkylink.title}"? This action cannot be undone.`}
      />

      <TweakModal
        isOpen={showTweakModal}
        onClose={() => setShowTweakModal(false)}
        linkylink={linkylink}
        onSave={handleTweakSave}
      />

      {/* Icon Picker for new category */}
      <CategoryIconPicker
        selectedIcon={newCategoryIcon}
        onSelect={(icon) => setNewCategoryIcon(icon)}
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
      />

      {/* Icon Picker for editing existing category */}
      {editingCategoryIcon && (
        <CategoryIconPicker
          selectedIcon={(categories.find(c => c.id === editingCategoryIcon)?.icon || "Star") as CategoryIconName}
          onSelect={(icon) => handleUpdateCategoryIcon(editingCategoryIcon, icon)}
          isOpen={true}
          onClose={() => setEditingCategoryIcon(null)}
        />
      )}
    </div>
  )
}
