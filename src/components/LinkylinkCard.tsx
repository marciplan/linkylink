"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Eye, Link2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "./Avatar"

interface LinkylinkCardProps {
  title: string
  subtitle?: string | null
  avatar?: string | null
  userImage?: string | null
  slug: string
  username: string
  linkCount: number
  views: number
  headerImage?: string | null
  className?: string
}

export function LinkylinkCard({
  title,
  subtitle,
  avatar,
  userImage,
  slug,
  username,
  linkCount,
  views,
  headerImage,
  className,
}: LinkylinkCardProps) {
  return (
    <Link href={`/${username}/${slug}`}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative block rounded-lg border border-gray-200 hover:border-gray-400 transition-all cursor-pointer overflow-hidden",
          className
        )}
      >
        {/* Header Image */}
        {headerImage ? (
          <div className="relative w-full h-[60px] overflow-hidden">
            <Image
              src={headerImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
          </div>
        ) : (
          <div className="w-full h-[60px] bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700" />
        )}

        {/* Content overlaying the header */}
        <div className="relative -mt-4 mx-4 mb-4 bg-white rounded-lg p-5">
          <div className="flex items-start gap-3 mb-3">
            <Avatar
              src={avatar || userImage}
              username={username}
              size={40}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-medium text-gray-900 truncate">{title}</h3>
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>
              {subtitle && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{subtitle}</p>
              )}
              <p className="text-xs text-gray-400">@{username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              {linkCount} {linkCount === 1 ? 'link' : 'links'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {views} {views === 1 ? 'view' : 'views'}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}