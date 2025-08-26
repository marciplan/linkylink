"use client"

import { useState } from "react"
import Image from "next/image"
import { HeaderImageModal } from "./HeaderImageModal"

// Custom hook for background functionality
export function useBackgroundHandler(linkylink: {
  id: string
  title: string
  subtitle: string | null
  headerImages?: string[]
  headerPrompt?: string | null
  headerImage?: string | null
}) {
  const [showModal, setShowModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleBackgroundClick = async () => {
    // If no header images exist yet, generate them
    if (!linkylink.headerImages || linkylink.headerImages.length === 0) {
      setIsGenerating(true)
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
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // Update the linkylink object with new data
          linkylink.headerPrompt = data.prompt
          linkylink.headerImages = data.images
          linkylink.headerImage = data.selectedImage
        } else {
          const errorData = await response.json()
          console.error('Failed to generate header images:', response.status, errorData)
        }
      } catch (error) {
        console.error('Error generating header images:', error)
      } finally {
        setIsGenerating(false)
      }
    }
    
    setShowModal(true)
  }

  return {
    handleBackgroundClick,
    isGenerating,
    showModal,
    setShowModal,
  }
}

interface VisualHeaderProps {
  linkylink: {
    id: string
    title: string
    subtitle: string | null
    headerImage?: string | null
    headerPrompt?: string | null
    headerImages?: string[]
  }
  isOwner?: boolean
  isEditMode?: boolean
  className?: string
  children?: React.ReactNode
  showModal?: boolean
  onModalClose?: () => void
}

export function VisualHeader({ linkylink, className = "", children, showModal = false, onModalClose }: VisualHeaderProps) {


  return (
    <>
      <div className={`relative w-full h-[40vh] overflow-hidden ${className}`}>
        {linkylink.headerImage ? (
          <>
            {/* Background Image */}
            <Image
              src={linkylink.headerImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
            
          </>
        ) : (
          // Default gradient background when no header image
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 relative">
          </div>
        )}
        
        {/* Content Overlay */}
        {children && (
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10">
            {children}
          </div>
        )}
      </div>

      {/* Header Image Modal */}
      <HeaderImageModal
        isOpen={showModal}
        onClose={onModalClose || (() => {})}
        linkylink={linkylink}
      />
    </>
  )
}