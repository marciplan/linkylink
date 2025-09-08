"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, Reorder } from "framer-motion"
import { ExternalLink, Trash2, Copy, Check, Link2, ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react"
import { VisualHeader } from "@/components/VisualHeader"
import { QuickNavSearch } from "@/components/QuickNavSearch"
import { deleteLink, updateLinkOrder, updateLinkylink } from "@/lib/actions"

interface EditLinkylinkViewProps {
  linkylink: {
    id: string
    title: string
    subtitle: string | null
    slug: string
    headerImage?: string | null
    headerPrompt?: string | null
    headerImages?: string[]
    links: {
      id: string
      title: string
      url: string
      favicon: string | null
      context: string | null
      order: number
    }[]
  }
  username: string
}

export default function EditLinkylinkView({ linkylink, username }: EditLinkylinkViewProps) {
  const [links, setLinks] = useState(linkylink.links)
  const [copied, setCopied] = useState(false)
  const [title, setTitle] = useState(linkylink.title)
  const [subtitle, setSubtitle] = useState(linkylink.subtitle || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingHeader, setIsGeneratingHeader] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track unsaved changes
  useEffect(() => {
    const titleChanged = title !== linkylink.title
    const subtitleChanged = subtitle !== (linkylink.subtitle || "")
    const linksChanged = JSON.stringify(links) !== JSON.stringify(linkylink.links)
    
    setHasUnsavedChanges(titleChanged || subtitleChanged || linksChanged)
  }, [title, subtitle, links, linkylink])
  
  const linkylinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${username}/${linkylink.slug}`

  // Adding links is now done on the public view for owners

  const handleDeleteLink = async (linkId: string) => {
    await deleteLink(linkId)
    setLinks(links.filter(l => l.id !== linkId))
  }

  const handleReorder = async (newOrder: typeof links) => {
    setLinks(newOrder)
    await updateLinkOrder(
      linkylink.id,
      newOrder.map(l => l.id)
    )
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(linkylinkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpdateTitle = async () => {
    if (!title.trim() || title === linkylink.title) return
    
    setIsSaving(true)
    try {
      await updateLinkylink(linkylink.id, { title: title.trim() })
      linkylink.title = title.trim()
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateSubtitle = async () => {
    if (subtitle === (linkylink.subtitle || "")) return
    
    setIsSaving(true)
    try {
      await updateLinkylink(linkylink.id, { subtitle: subtitle.trim() || undefined })
      linkylink.subtitle = subtitle.trim() || null
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateHeader = async () => {
    setIsGeneratingHeader(true)
    try {
      const response = await fetch('/api/generate-header', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkylinkId: linkylink.id,
          title: title,
          subtitle: subtitle,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the linkylink object with new data
        linkylink.headerPrompt = data.prompt
        linkylink.headerImages = data.images
        linkylink.headerImage = data.selectedImage
        // Force a re-render by updating state
        setTitle(title) // This will trigger a re-render
      } else {
        console.error('Failed to generate header images')
      }
    } catch (error) {
      console.error('Error generating header images:', error)
    } finally {
      setIsGeneratingHeader(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Visual Header with Profile Content Overlay */}
      <VisualHeader 
        linkylink={linkylink} 
        isOwner={true}
        isEditMode={true}
      >
        {/* Profile section overlaid on header */}
        <div className="text-center px-4 max-w-2xl mx-auto">
          {/* Title & Subtitle */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            className="w-full text-3xl font-bold text-center bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 focus:outline-none focus:border-white text-gray-900 mb-3 drop-shadow-lg"
            placeholder="Bundel Title"
            disabled={isSaving}
          />
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={handleUpdateSubtitle}
            className="w-full text-lg text-center bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:border-white text-gray-700 mb-4 drop-shadow-lg"
            placeholder="Add a subtitle (optional)"
            disabled={isSaving}
          />
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-4 text-sm text-white/90 drop-shadow-md">
            <span className="bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">@{username}</span>
          </div>
        </div>
      </VisualHeader>

      {/* Minimal fixed header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/dashboard" 
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            
            {/* Generate Header Button */}
            {(!linkylink.headerImage || linkylink.headerImages?.length === 0) && (
              <button
                onClick={handleGenerateHeader}
                disabled={isGeneratingHeader}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isGeneratingHeader ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Generate Header</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Quick Navigation Search */}
          <QuickNavSearch 
            username={username}
            currentSlug={linkylink.slug}
            hasUnsavedChanges={hasUnsavedChanges}
            className="w-[55vw] sm:w-[420px]"
          />
          
          <Link
            href={`/${username}/${linkylink.slug}`}
            target="_blank"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm"
          >
            <span className="hidden sm:inline">View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-12">
        
        {/* Links List */}
        {links.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2 font-medium">No links yet</p>
            <p className="text-sm text-gray-500">Use the Add Link on your Bundel page</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">Drag to reorder</p>
            <Reorder.Group
              axis="y"
              values={links}
              onReorder={handleReorder}
              className="space-y-2"
            >
              {links.map((link) => (
                <Reorder.Item
                  key={link.id}
                  value={link}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 cursor-move transition-all group flex items-center gap-3"
                  >
                    {/* Drag handle */}
                    <div className="text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                    
                    {/* Favicon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                      {link.favicon ? (
                        <Image 
                          src={link.favicon} 
                          alt="" 
                          width={24}
                          height={24}
                          className="object-contain"
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
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}

        {/* URL Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white rounded-lg border border-gray-200 p-4"
        >
          <p className="text-xs text-gray-500 mb-1">Your Bundel URL</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-mono text-gray-700 truncate">{linkylinkUrl}</p>
            <button
              onClick={handleCopyUrl}
              className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
