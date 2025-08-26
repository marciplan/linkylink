"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Link, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LinkInputProps {
  onAdd: (title: string, url: string, context?: string) => Promise<void>
  className?: string
}

export function LinkInput({ onAdd, className }: LinkInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [context, setContext] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const extractTitleFromUrl = (url: string): string => {
    if (!url) return ""
    
    try {
      const urlObj = new URL(url)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return

    setIsLoading(true)
    try {
      await onAdd(title, url, context.trim() || undefined)
      setTitle("")
      setUrl("")
      setContext("")
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("", className)}>
      {!isOpen ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(true)}
          className="w-full bg-gray-900 text-white rounded-lg p-4 font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Link
        </motion.button>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-lg p-4 border border-gray-200 space-y-3"
        >
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              URL
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  const newUrl = e.target.value
                  setUrl(newUrl)
                  
                  // Auto-generate title from URL if title is empty
                  if (!title.trim()) {
                    const suggestedTitle = extractTitleFromUrl(newUrl)
                    setTitle(suggestedTitle)
                  }
                }}
                placeholder="https://example.com"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Link"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Context <span className="text-gray-400">(optional, 280 chars)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => {
                if (e.target.value.length <= 280) {
                  setContext(e.target.value)
                }
              }}
              placeholder="Add some context or description for this link..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors resize-none"
              disabled={isLoading}
              rows={2}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {context.length}/280
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setTitle("")
                setUrl("")
                setContext("")
              }}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title || !url || isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </button>
          </div>
        </motion.form>
      )}
    </div>
  )
}