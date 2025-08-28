"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { X, Check, Settings, Loader2, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar } from "./Avatar"

interface TweakModalProps {
  isOpen: boolean
  onClose: () => void
  linkylink: {
    id: string
    title: string
    subtitle: string | null
    avatar?: string | null
    headerImage?: string | null
    headerPrompt?: string | null
    headerImages?: string[]
  }
  onSave: (updates: { avatar?: string | null, headerImage?: string | null }) => Promise<void>
}

export function TweakModal({ isOpen, onClose, linkylink, onSave }: TweakModalProps) {
  const [activeTab, setActiveTab] = useState<'background' | 'icon'>('icon')
  const [selectedBackground, setSelectedBackground] = useState(linkylink.headerImage || '')
  const [selectedIcon, setSelectedIcon] = useState(linkylink.avatar || '')
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false)
  const [isLoadingEmojis, setIsLoadingEmojis] = useState(false)
  const [suggestedEmojis, setSuggestedEmojis] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const loadEmojiSuggestions = useCallback(async () => {
    setIsLoadingEmojis(true)
    try {
      const response = await fetch('/api/suggest-emojis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: linkylink.title,
          subtitle: linkylink.subtitle,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestedEmojis(data.emojis || [])
      } else {
        setSuggestedEmojis(['📝', '💼', '🌟', '🎯', '🚀', '💡', '🎨', '📊'])
      }
    } catch (error) {
      console.error('Error loading emoji suggestions:', error)
      setSuggestedEmojis(['📝', '💼', '🌟', '🎯', '🚀', '💡', '🎨', '📊'])
    } finally {
      setIsLoadingEmojis(false)
    }
  }, [linkylink.title, linkylink.subtitle])

  // Load emoji suggestions when modal opens
  useEffect(() => {
    if (isOpen && suggestedEmojis.length === 0) {
      loadEmojiSuggestions()
    }
  }, [isOpen, loadEmojiSuggestions, suggestedEmojis.length])

  const generateBackgrounds = async () => {
    if (!linkylink.headerImages || linkylink.headerImages.length === 0) {
      setIsGeneratingBackgrounds(true)
      try {
        const response = await fetch('/api/generate-header', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            linkylinkId: linkylink.id,
            title: linkylink.title,
            subtitle: linkylink.subtitle,
            selectedEmoji: selectedIcon, // Pass selected emoji to influence color palette
          }),
        })

        if (response.ok) {
          const data = await response.json()
          linkylink.headerPrompt = data.prompt
          linkylink.headerImages = data.images
          linkylink.headerImage = data.selectedImage
          setSelectedBackground(data.selectedImage)
        }
      } catch (error) {
        console.error('Error generating backgrounds:', error)
      } finally {
        setIsGeneratingBackgrounds(false)
      }
    }
  }

  const handleBackgroundSelect = async (imageUrl: string) => {
    if (imageUrl === selectedBackground) return

    try {
      const response = await fetch('/api/select-header-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkylinkId: linkylink.id,
          imageUrl,
        }),
      })

      if (response.ok) {
        setSelectedBackground(imageUrl)
        linkylink.headerImage = imageUrl
      }
    } catch (error) {
      console.error('Error selecting background:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        avatar: selectedIcon || null,
        headerImage: selectedBackground || null,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save tweaks:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Tweak Design
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('icon')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'icon'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Icon
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'background'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Background
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'background' && (
              <div className="space-y-4">
                {!linkylink.headerImages || linkylink.headerImages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Generate background options for your LinkyLink</p>
                    <button
                      onClick={generateBackgrounds}
                      disabled={isGeneratingBackgrounds}
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {isGeneratingBackgrounds ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Generate Backgrounds
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Choose a background style</p>
                      <button
                        onClick={() => {
                          // Reset headerImages to trigger regeneration
                          linkylink.headerImages = []
                          generateBackgrounds()
                        }}
                        disabled={isGeneratingBackgrounds}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {isGeneratingBackgrounds ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Refresh Themes
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {linkylink.headerImages.map((imageUrl, index) => (
                        <motion.div
                          key={imageUrl}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative group cursor-pointer"
                          onClick={() => handleBackgroundSelect(imageUrl)}
                        >
                          <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={`Background option ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            
                            {selectedBackground === imageUrl && (
                              <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-lg flex items-center justify-center">
                                <div className="bg-blue-500 text-white p-2 rounded-full">
                                  <Check className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Option {index + 1}
                            {selectedBackground === imageUrl && ' (Selected)'}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'icon' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Choose an emoji as your icon</p>
                  <button
                    onClick={loadEmojiSuggestions}
                    disabled={isLoadingEmojis}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                  >
                    {isLoadingEmojis ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Refresh
                  </button>
                </div>

                {isLoadingEmojis ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-600 mt-2">Getting suggestions...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-3">
                    {suggestedEmojis.slice(0, 5).map((emoji, index) => (
                      <motion.button
                        key={`${emoji}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedIcon(emoji)}
                        className={`aspect-square rounded-lg text-3xl flex items-center justify-center transition-all hover:scale-110 ${
                          selectedIcon === emoji
                            ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Option to remove icon */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => setSelectedIcon('')}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      selectedIcon === ''
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Avatar 
                      src={null} 
                      username={linkylink.title} 
                      size={32} 
                      className="flex-shrink-0"
                    />
                    <span className="flex-1 text-left">Use default avatar (no emoji)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}