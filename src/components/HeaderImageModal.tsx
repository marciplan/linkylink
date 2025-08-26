"use client"

import { useState } from "react"
import Image from "next/image"
import { X, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface HeaderImageModalProps {
  isOpen: boolean
  onClose: () => void
  linkylink: {
    id: string
    headerImage?: string | null
    headerPrompt?: string | null
    headerImages?: string[]
  }
}

export function HeaderImageModal({ isOpen, onClose, linkylink }: HeaderImageModalProps) {
  const [selectedImage, setSelectedImage] = useState(linkylink.headerImage || '')
  const [isSelecting, setIsSelecting] = useState(false)

  const handleImageSelect = async (imageUrl: string) => {
    if (imageUrl === selectedImage) return

    setIsSelecting(true)
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
        setSelectedImage(imageUrl)
        // Update the parent linkylink object
        linkylink.headerImage = imageUrl
        
        // Close modal after a brief delay to show the selection
        setTimeout(() => {
          onClose()
        }, 500)
      } else {
        console.error('Failed to select image')
      }
    } catch (error) {
      console.error('Error selecting image:', error)
    } finally {
      setIsSelecting(false)
    }
  }

  if (!linkylink.headerImages || linkylink.headerImages.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Header Images</h2>
                  {linkylink.headerPrompt && (
                    <p className="text-sm text-gray-600 mt-1">&ldquo;{linkylink.headerPrompt}&rdquo;</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {linkylink.headerImages.map((imageUrl, index) => (
                    <motion.div
                      key={imageUrl}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group cursor-pointer"
                      onClick={() => handleImageSelect(imageUrl)}
                    >
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={`Header option ${index + 1}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        
                        {/* Selected overlay */}
                        {selectedImage === imageUrl && (
                          <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-lg flex items-center justify-center">
                            <div className="bg-blue-500 text-white p-2 rounded-full">
                              <Check className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                        
                        {/* Loading overlay */}
                        {isSelecting && selectedImage === imageUrl && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Option {index + 1}
                        {selectedImage === imageUrl && ' (Selected)'}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    Click on an image to select it as your header background
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}