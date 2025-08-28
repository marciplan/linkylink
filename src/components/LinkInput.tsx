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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return

    const normalizedUrl = normalizeUrl(url)
    
    setIsLoading(true)
    try {
      await onAdd(title, normalizedUrl, context.trim() || undefined)
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
          className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg p-4 font-medium flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Link
        </motion.button>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              URL
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  const rawInput = e.target.value
                  setUrl(rawInput)
                  
                  // Auto-generate title from URL if title is empty
                  if (!title.trim() && rawInput.trim()) {
                    const suggestedTitle = extractTitleFromUrl(rawInput)
                    setTitle(suggestedTitle)
                  }
                }}
                onBlur={(e) => {
                  // Normalize URL when user leaves the field
                  const rawInput = e.target.value
                  if (rawInput.trim()) {
                    const normalized = normalizeUrl(rawInput)
                    setUrl(normalized)
                  }
                }}
                placeholder="example.com or https://example.com"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Link"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">
              Context <span className="text-gray-400 dark:text-gray-500">(optional, 280 chars)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => {
                if (e.target.value.length <= 280) {
                  setContext(e.target.value)
                }
              }}
              placeholder="Add some context or description for this link..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
              rows={2}
            />
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
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
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title || !url || isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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