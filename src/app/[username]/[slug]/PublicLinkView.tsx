"use client"

import { useState, useEffect } from "react"
import { motion, Reorder, useDragControls } from "framer-motion"
import { Eye, Edit2, Save, Trash2, Copy, Check, ExternalLink, GripVertical } from "lucide-react"
import { LinkCard } from "@/components/LinkCard"
import { LinkInput } from "@/components/LinkInput"
import { incrementClicks, updateLinkylink, addLink, deleteLink, updateLinkOrder } from "@/lib/actions"

interface PublicLinkViewProps {
  linkylink: {
    id: string
    title: string
    subtitle: string | null
    views: number
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
  link: any
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
          {link.favicon ? (
            <img 
              src={link.favicon} 
              alt="" 
              className="w-6 h-6 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <ExternalLink className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        {/* Link info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {link.title}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {new URL(link.url).hostname.replace("www.", "")}
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
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(linkylink.title)
  const [subtitle, setSubtitle] = useState(linkylink.subtitle || "")
  const [links, setLinks] = useState(linkylink.links)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const [currentUrl, setCurrentUrl] = useState('')
  
  // Set URL on client side only
  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateLinkylink(linkylink.id, { 
        title: title.trim(), 
        subtitle: subtitle.trim() || null 
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

  const handleAddLink = async (linkTitle: string, url: string) => {
    const newLink = await addLink({
      linkylinkId: linkylink.id,
      title: linkTitle,
      url,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header with edit controls */}
      {isOwner && (
        <div className="fixed top-4 right-4 z-50">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm flex items-center gap-2 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Profile section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* User avatar */}
          <div className="mb-4">
            {linkylink.user.image ? (
              <img
                src={linkylink.user.image}
                alt={linkylink.user.name || linkylink.user.username}
                className="w-20 h-20 rounded-full mx-auto border-4 border-white shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto flex items-center justify-center text-2xl font-medium text-gray-600 border-4 border-white shadow-sm">
                {linkylink.user.username[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Title & subtitle */}
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-semibold text-center bg-white border border-gray-200 rounded-lg px-4 py-2 focus:border-gray-400 focus:outline-none"
                placeholder="LinkyLink Title"
                disabled={isSaving}
              />
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full text-gray-600 text-center bg-white border border-gray-200 rounded-lg px-4 py-2 focus:border-gray-400 focus:outline-none"
                placeholder="Add a subtitle (optional)"
                disabled={isSaving}
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h1>
              {subtitle && (
                <p className="text-gray-600">{subtitle}</p>
              )}
            </>
          )}

          {/* User info and stats - always visible */}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <span>@{linkylink.user.username}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {linkylink.views} views
            </span>
          </div>
        </motion.div>

        {/* Links section */}
        <div className="space-y-3 mb-6">
          {/* Add link button when editing */}
          {isEditing && (
            <LinkInput onAdd={handleAddLink} className="mb-4" />
          )}

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
                    onClick={() => handleLinkClick(link.id, link.url)}
                  />
                </motion.div>
              ))}
            </motion.div>
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

        {/* Footer */}
        {!isOwner && (
          <div className="text-center mt-12">
            <p className="text-sm text-gray-400">
              Create your own at{" "}
              <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                linklink.app
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}