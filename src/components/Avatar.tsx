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
  const [gradient, setGradient] = useState<string>("")
  const initial = username?.charAt(0)?.toUpperCase() || "?"

  useEffect(() => {
    if (!src && username) {
      const gradientString = generateGradient(username)
      setGradient(gradientString)
    }
  }, [src, username])

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

  return (
    <div
      className={`relative flex items-center justify-center text-white font-semibold rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: gradient,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  )
}