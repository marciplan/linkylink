"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { HeaderImageModal } from "./HeaderImageModal"

// Fallback gradient palettes for when no header image is set
const FALLBACK_PALETTES = [
  ['#ff6b6b', '#ffa500', '#ff8c42'],      // warm sunset
  ['#0077be', '#4fb3d9', '#6bb6ff'],      // ocean depths
  ['#2d5016', '#4a7c59', '#6b9080'],      // forest morning
  ['#4b0082', '#6a0dad', '#8b00ff'],      // cosmic purple
  ['#d4af37', '#ffd700', '#ffb347'],      // golden hour
  ['#ff69b4', '#ffb6c1', '#ffc0cb'],      // pink dawn
  ['#0080ff', '#00bfff', '#1e90ff'],      // electric blue
  ['#8b4513', '#a0522d', '#cd853f'],      // earth tones
  ['#ff0080', '#00ff80', '#8000ff'],      // neon lights
  ['#2c3e50', '#34495e', '#3498db'],      // professional
]

// Simple hash function for deterministic selection
const hashString = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

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
  // Generate deterministic gradient based on title/id
  const fallbackGradient = useMemo(() => {
    const index = hashString(linkylink.title || linkylink.id) % FALLBACK_PALETTES.length
    const palette = FALLBACK_PALETTES[index]
    return `linear-gradient(135deg, ${palette[0]}, ${palette[2] || palette[1]})`
  }, [linkylink.title, linkylink.id])

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
          // Default gradient background when no header image (deterministic based on title)
          <div
            className="w-full h-full relative"
            style={{ background: fallbackGradient }}
          />
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