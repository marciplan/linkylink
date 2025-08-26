"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import generateGradient from "gradient-avatar"

interface AvatarProps {
  src?: string | null
  username: string
  size?: number
  className?: string
}

export function Avatar({ src, username, size = 80, className = "" }: AvatarProps) {
  const [gradientSvg, setGradientSvg] = useState<string>("")
  const initial = username?.charAt(0)?.toUpperCase() || "?"

  useEffect(() => {
    if (!src && username) {
      const svgString = generateGradient(username, size)
      setGradientSvg(svgString)
    }
  }, [src, username, size])

  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={`${username}'s avatar`}
          fill
          className="object-cover"
        />
      </div>
    )
  }

  if (gradientSvg) {
    return (
      <div
        className={`relative overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <div dangerouslySetInnerHTML={{ __html: gradientSvg }} />
        <div 
          className="absolute inset-0 flex items-center justify-center text-white font-semibold"
          style={{ fontSize: size * 0.4, textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}
        >
          {initial}
        </div>
      </div>
    )
  }

  // Fallback with CSS gradient if SVG generation fails
  return (
    <div
      className={`relative flex items-center justify-center text-white font-semibold rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${username.charCodeAt(0) * 7 % 360}, 70%, 50%), hsl(${username.charCodeAt(1 || 0) * 13 % 360}, 70%, 60%))`,
        fontSize: size * 0.4,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}
    >
      {initial}
    </div>
  )
}