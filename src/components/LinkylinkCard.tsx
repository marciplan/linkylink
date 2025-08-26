"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, Link2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface LinkylinkCardProps {
  title: string
  subtitle?: string | null
  slug: string
  username: string
  linkCount: number
  views: number
  className?: string
}

export function LinkylinkCard({
  title,
  subtitle,
  slug,
  username,
  linkCount,
  views,
  className,
}: LinkylinkCardProps) {
  return (
    <Link href={`/${username}/${slug}`}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative block bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-400 transition-all cursor-pointer",
          className
        )}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
        
        {subtitle && (
          <p className="text-sm text-gray-600 mb-3">{subtitle}</p>
        )}
        
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
        
        <p className="text-xs text-gray-400 mt-2">@{username}</p>
      </motion.div>
    </Link>
  )
}