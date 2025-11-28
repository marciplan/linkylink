"use client"

import { useState, useEffect } from "react"
import { motion, Reorder, useDragControls } from "framer-motion"
import { Eye, Edit2, Save, Trash2, Copy, Check, ExternalLink, GripVertical, Share, AtSign, Calendar, Settings, Link2, FileText } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Avatar } from "@/components/Avatar"
import { LinkCard } from "@/components/LinkCard"
import { LinkInput } from "@/components/LinkInput"
import { DeleteModal } from "@/components/DeleteModal"
import { VisualHeader } from "@/components/VisualHeader"
import { TweakModal } from "@/components/TweakModal"
import { QuickNavSearch } from "@/components/QuickNavSearch"
import { incrementClicks, updateLinkylink, addLink, deleteLink, updateLinkOrder, deleteLinkylink } from "@/lib/actions"

interface PublicLinkViewProps {
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
    user: {
      username: string
      name: string | null
      image: string | null
    }
    links: {
      id: string
      title: string
      url: string
      favicon: string | null
      context: string | null
      order?: number
    }[]
  }
  isOwner?: boolean
}

// Create a component for the draggable item
function DraggableLink({
  link,
  onDelete
}: {
  link: {
    id: string
    title: string
    url: string
    favicon: string | null
    context: string | null
    order?: number
  }
  onDelete: (id: string) => void
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={link}
      id={link.id}
      dragListener={false}
      dragControls={controls}
      className="relative"
    >
      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-gray-400 transition-all flex items-center gap-3 group">
        {/* Drag handle */}
        <div
          onPointerDown={(e) => controls.start(e)}
          className="text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Favicon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
          {(() => {
            const domain = (() => {
              try { return new URL(link.url).hostname.replace('www.', '') } catch { return '' }
            })()
            const src = link.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
            return (
              <Image
                src={src}
                alt=""
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
                unoptimized
              />
            )
          })()}
        </div>

        {/* Link info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {link.title}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {(() => {
              try {
                return new URL(link.url).hostname.replace("www.", "")
              } catch {
                return link.url || "Invalid URL"
              }
            })()}
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(link.id)}
          className="p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>
    </Reorder.Item>
  )
}

export default function PublicLinkView({ linkylink, isOwner = false }: PublicLinkViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isEditing, setIsEditing] = useState(false)
  const currentSlug = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : ''
  const [title, setTitle] = useState(linkylink.title)
  const [subtitle, setSubtitle] = useState(linkylink.subtitle || "")
  const [links, setLinks] = useState(linkylink.links)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [currentUrl, setCurrentUrl] = useState('')
  const [showTweakModal, setShowTweakModal] = useState(false)

  // Set URL on client side only and check for edit mode
  useEffect(() => {
    setCurrentUrl(window.location.href)

    // Check if we should start in edit mode
    if (isOwner && searchParams.get('edit') === 'true') {
      setIsEditing(true)
      // Remove the edit parameter from URL without reloading
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('edit')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [isOwner, searchParams])

  const handleLinkClick = async (linkId: string, url: string) => {
    if (isEditing) return // Don't open links when editing
    // Track click
    incrementClicks(linkId)
    // Open link
    window.open(url, "_blank", "noopener,noreferrer")
  }

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
        // User cancelled or sharing failed, fallback to copy
        if (error instanceof Error && error.name !== 'AbortError') {
          handleCopyUrl()
        }
      }
    } else {
      // Fallback to copy if Web Share API is not supported
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
    setIsEditing(false)
  }

  const handleAddLink = async (linkTitle: string, url: string, context?: string) => {
    const newLink = await addLink({
      linkylinkId: linkylink.id,
      title: linkTitle,
      url,
      context,
    })
    // Add the new link with proper order
    setLinks([...links, { ...newLink, order: links.length }])
  }

  const handleDeleteLink = async (linkId: string) => {
    await deleteLink(linkId)
    setLinks(links.filter(l => l.id !== linkId))
  }

  const handleReorder = (newOrder: typeof links) => {
    // Update local state immediately for smooth UX
    setLinks(newOrder)

    // Update order in database
    updateLinkOrder(
      linkylink.id,
      newOrder.map(l => l.id)
    ).catch(error => {
      console.error('Failed to update link order:', error)
      // Optionally revert on error
      setLinks(links)
    })
  }

  const handleDelete = async () => {
    await deleteLinkylink(linkylink.id)
    router.push('/dashboard')
  }

  const handleTweakSave = async (updates: { avatar?: string | null, headerImage?: string | null }) => {
    // Handle avatar update
    if (updates.avatar !== undefined) {
      await updateLinkylink(linkylink.id, {
        avatar: updates.avatar || undefined // Convert null to undefined
      })
      linkylink.avatar = updates.avatar
    }

    // Handle header image update (this might need a separate API endpoint)
    if (updates.headerImage !== undefined) {
      linkylink.headerImage = updates.headerImage
      // Note: updateLinkylink doesn't support headerImage yet
      // TODO: Add headerImage support to updateLinkylink or create separate endpoint
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Visual Header with Profile Content Overlay */}
      <VisualHeader
        linkylink={linkylink}
        isOwner={isOwner}
        isEditMode={isEditing}
      >
        {/* Profile section overlaid on header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4 max-w-2xl mx-auto"
        >
          {/* Avatar */}
          <div className="mb-4 flex justify-center">
            <div className="border-4 border-white/50 shadow-lg rounded-full backdrop-blur-sm">
              <Avatar
                src={linkylink.avatar || linkylink.user.image}
                username={linkylink.user.username}
                size={80}
              />
            </div>
          </div>

          {/* Title & subtitle */}
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-semibold text-center bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg px-4 py-2 focus:border-white/70 focus:bg-white/70 focus:outline-none text-gray-900 placeholder-gray-500"
                placeholder="Bundel Title"
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

          {/* User info and stats - only show when not editing */}
          {!isEditing && (
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-white/90 drop-shadow-md">
              <span
                className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
                title={`Created by @${linkylink.user.username}`}
              >
                <AtSign className="w-3.5 h-3.5" />
                {linkylink.user.username}
              </span>
              <span
                className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
                title={`${linkylink.views.toLocaleString()} total views`}
              >
                <Eye className="w-3.5 h-3.5" />
                {linkylink.views.toLocaleString()}
              </span>
              <span
                className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
                title={`Created on ${new Date(linkylink.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {new Date(linkylink.createdAt).toLocaleDateString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </motion.div>
      </VisualHeader>

      {/* Header with controls */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href={isOwner ? "/dashboard" : "/"}
          className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <Link2 className="w-4 h-4" />
          Bundel
        </Link>
      </div>

      {isOwner && isEditing && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowTweakModal(true)}
            className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm font-semibold flex items-center gap-2 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Tweak
          </button>
        </div>
      )}

      {/* Quick Navigation Search - only visible to owner */}
      {isOwner && (
        <div className="fixed top-4 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-40">
          <QuickNavSearch
            username={linkylink.user.username}
            currentSlug={currentSlug}
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Links section */}
        <div className="space-y-3 mb-6">
          {/* Links */}
          {links.length === 0 && !isEditing ? (
            <div className="text-center py-12 text-gray-400">
              No links added yet
            </div>
          ) : isEditing ? (
            <>
              {links.length > 0 && (
                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  Drag to reorder
                </p>
              )}
              <Reorder.Group
                axis="y"
                values={links}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {links.map((link) => (
                  <DraggableLink
                    key={link.id}
                    link={link}
                    onDelete={handleDeleteLink}
                  />
                ))}
              </Reorder.Group>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              {links.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <LinkCard
                    title={link.title}
                    url={link.url}
                    favicon={link.favicon}
                    context={link.context}
                    userAvatar={linkylink.avatar || linkylink.user.image}
                    username={linkylink.user.username}
                    onClick={() => handleLinkClick(link.id, link.url)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Add link input below the current URLs (owner only) */}
          {isOwner && (
            <LinkInput onAdd={handleAddLink} className="mt-4" />
          )}
        </div>

        {/* Share URL section - visible to everyone */}
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
                className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-900 rounded-lg font-mono text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 outline-none cursor-text transition-all"
                placeholder="Loading URL..."
              />
              <button
                onClick={handleCopyUrl}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors"
                title={copied ? "Copied!" : "Copy URL"}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            {copied && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-gray-600 mt-2 text-center"
              >
                Copied to clipboard!
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Edit Controls */}
        {isOwner && isEditing && (
          <div className="mt-12 pt-8 border-t border-gray-200 space-y-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-white text-gray-600 rounded-lg font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-50 text-red-600 rounded-lg p-4 font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Delete Bundel
            </button>
          </div>
        )}

        {/* Owner controls (non-edit mode) */}
        {isOwner && !isEditing && currentUrl && (
          <div className="mt-12 pt-8 border-t border-gray-200 space-y-3">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-gray-50 text-gray-600 rounded-lg p-4 font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <Edit2 className="w-5 h-5" />
              Edit Bundel
            </button>
            <button
              onClick={handleShare}
              className="w-full bg-blue-50 text-blue-600 rounded-lg p-4 font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
            >
              <Share className="w-5 h-5" />
              Share Bundel
            </button>
            <Link
              href={`/${linkylink.user.username}/kobo/${currentSlug}`}
              className="w-full bg-gray-50 text-gray-600 rounded-lg p-4 font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <FileText className="w-5 h-5" />
              Kobo View
            </Link>
          </div>
        )}

        {/* Footer */}
        {!isOwner && (
          <div className="text-center mt-12">
            <p className="text-sm text-gray-400">
              Create your own at{" "}
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                linklink.app
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Bundel"
        message={`Are you sure you want to delete "${linkylink.title}"? This action cannot be undone and will permanently remove this Bundel and all its links.`}
      />

      {/* Tweak Modal */}
      <TweakModal
        isOpen={showTweakModal}
        onClose={() => setShowTweakModal(false)}
        linkylink={linkylink}
        onSave={handleTweakSave}
      />
    </div>
  )
}
