"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, Reorder } from "framer-motion"
import { ExternalLink, Trash2, Copy, Check, Link2, Eye, ArrowLeft } from "lucide-react"
import { LinkInput } from "@/components/LinkInput"
import { addLink, deleteLink, updateLinkOrder, updateLinkylink } from "@/lib/actions"

interface EditLinkylinkViewProps {
  linkylink: {
    id: string
    title: string
    subtitle: string | null
    slug: string
    links: {
      id: string
      title: string
      url: string
      favicon: string | null
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
  
  const linkylinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${username}/${linkylink.slug}`

  const handleAddLink = async (title: string, url: string) => {
    const newLink = await addLink({
      linkylinkId: linkylink.id,
      title,
      url,
    })
    
    setLinks([...links, newLink])
  }

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
      await updateLinkylink(linkylink.id, { subtitle: subtitle.trim() || null })
      linkylink.subtitle = subtitle.trim() || null
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal fixed header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href={`/${username}/${linkylink.slug}`}
            target="_blank"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm"
          >
            View
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-12">
        {/* Title & Subtitle */}
        <div className="text-center mb-8">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            className="w-full text-2xl font-semibold text-center bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-gray-300 rounded-lg px-4 py-2 focus:outline-none transition-all"
            placeholder="LinkyLink Title"
            disabled={isSaving}
          />
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={handleUpdateSubtitle}
            className="w-full text-gray-600 text-center bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-gray-300 rounded-lg px-4 py-2 focus:outline-none transition-all mt-2"
            placeholder="Add a subtitle (optional)"
            disabled={isSaving}
          />
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <span>@{username}</span>
          </div>
        </div>

        {/* Add Link */}
        <LinkInput onAdd={handleAddLink} className="mb-6" />

        {/* Links List */}
        {links.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2 font-medium">No links yet</p>
            <p className="text-sm text-gray-500">Add your first link above</p>
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
          <p className="text-xs text-gray-500 mb-1">Your LinkyLink URL</p>
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