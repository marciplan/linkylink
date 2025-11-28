"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ArrowRight, X } from "lucide-react"
import { Avatar } from "@/components/Avatar"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface LinkyLinkResult {
  id: string
  title: string
  subtitle: string | null
  slug: string
  username: string
  linkCount: number
  avatar?: string | null
  headerImage?: string | null
}

interface QuickNavSearchProps {
  username: string
  currentSlug?: string
  hasUnsavedChanges?: boolean
  onNavigate?: () => void
  className?: string
}

export function QuickNavSearch({ username, currentSlug, hasUnsavedChanges = false, onNavigate, className }: QuickNavSearchProps) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<LinkyLinkResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const isMobile = window.innerWidth < 640
        if (isMobile) {
          setIsExpanded(true)
          setTimeout(() => mobileInputRef.current?.focus(), 50)
        } else {
          setTimeout(() => desktopInputRef.current?.focus(), 50)
        }
      }
      if (e.key === "Escape") {
        setSearch("")
        setResults([])
        setSelectedIndex(-1)
        setShowUnsavedWarning(false)
        setIsExpanded(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Click outside to collapse on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
        setSearch("")
        setResults([])
        setSelectedIndex(-1)
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded])

  useEffect(() => {
    if (!search.trim()) {
      setResults([])
      setSelectedIndex(-1)
      return
    }

    const searchLinkyLinks = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search-linkylinks?q=${encodeURIComponent(search)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchLinkyLinks, 300)
    return () => clearTimeout(debounceTimer)
  }, [search])

  const handleNavigation = (slug: string) => {
    if (hasUnsavedChanges && slug !== currentSlug) {
      setPendingNavigation(slug)
      setShowUnsavedWarning(true)
      return
    }
    navigateToSlug(slug)
  }

  const navigateToSlug = (slug: string) => {
    setSearch("")
    setResults([])
    setSelectedIndex(-1)
    onNavigate?.()
    router.push(`/${username}/${slug}`)
  }

  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigateToSlug(pendingNavigation)
    }
    setShowUnsavedWarning(false)
    setPendingNavigation(null)
  }

  const cancelNavigation = () => {
    setShowUnsavedWarning(false)
    setPendingNavigation(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < results.length) {
      e.preventDefault()
      handleNavigation(results[selectedIndex].slug)
    }
  }

  const filteredResults = results.filter(result => result.slug !== currentSlug)

  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => mobileInputRef.current?.focus(), 50)
  }

  const handleCollapse = () => {
    setIsExpanded(false)
    setSearch("")
    setResults([])
    setSelectedIndex(-1)
  }

  // Render the search input and results (shared between mobile expanded and desktop)
  const renderSearchInput = (isMobile: boolean) => (
    <div className={isMobile ? "w-[65vw] max-w-[90vw]" : "w-[420px] max-w-[90vw]"}>
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 p-[1px] rounded-xl shadow-sm">
        <div className="relative bg-white rounded-[10px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={isMobile ? mobileInputRef : desktopInputRef}
            type="text"
            placeholder="Search your Bundels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full h-10 pl-10 text-sm rounded-[10px] outline-none focus:ring-2 focus:ring-purple-100 ${isMobile ? "pr-10" : "pr-4"}`}
          />
          {isMobile && (
            <button
              onClick={handleCollapse}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {(loading || search.trim().length > 0) && (
        <div
          ref={resultsRef}
          className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : filteredResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {search.trim() ? "No Bundels found" : "Start typing to search your Bundels"}
            </div>
          ) : (
            filteredResults.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleNavigation(result.slug)}
                className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                  selectedIndex === index ? "bg-gray-50" : ""
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Avatar src={result.avatar || undefined} username={result.title || result.username} size={28} className="shrink-0" />
                  <div className="flex-1">
                    {result.headerImage ? (
                      <div
                        className="font-semibold bg-clip-text text-transparent bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.30), rgba(0,0,0,0.30)), url('${result.headerImage}')` }}
                      >
                        {result.title}
                      </div>
                    ) : (
                      <div className="font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                        {result.title}
                      </div>
                    )}
                  {result.subtitle && (
                    <div className="text-sm text-gray-500">{result.subtitle}</div>
                  )}
                    <div className="text-xs text-gray-400 mt-1">
                      {result.linkCount} {result.linkCount === 1 ? "link" : "links"}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </button>
            ))
          )}
          {/* Keyboard hints */}
          <div className="p-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-center gap-2">
            <span className="hidden sm:inline">Use</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-700">↑↓</kbd>
            <span>to navigate</span>
            <span>•</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-700">Enter</kbd>
            <span>to select</span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div ref={containerRef} className={`relative ${className ?? ""}`}>
        {/* Mobile: Icon button when collapsed */}
        {!isExpanded && (
          <button
            onClick={handleExpand}
            className="sm:hidden bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 p-[1px] rounded-xl shadow-sm"
          >
            <div className="bg-white rounded-[10px] p-2.5">
              <Search className="h-5 w-5 text-gray-600" />
            </div>
          </button>
        )}

        {/* Mobile: Expanded search input with animation */}
        <div className="sm:hidden">
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {renderSearchInput(true)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop: Always visible (no animation) */}
        <div className="hidden sm:block">
          {renderSearchInput(false)}
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      <AnimatePresence>
        {showUnsavedWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={cancelNavigation}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl border w-full max-w-md mx-4 p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
              <p className="text-gray-600 mb-6">
                You have unsaved changes that will be lost if you navigate away. Are you sure you want to continue?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelNavigation}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Stay Here
                </button>
                <button
                  onClick={confirmNavigation}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Leave Page
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No trigger button; input is always visible */}
    </>
  )
}
