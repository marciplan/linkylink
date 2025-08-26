"use client"

import { motion } from "framer-motion"
import { ExternalLink, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface LinkCardProps {
  title: string
  url: string
  favicon?: string | null
  onClick?: () => void
  isDragging?: boolean
  className?: string
}

export function LinkCard({
  title,
  url,
  favicon,
  onClick,
  isDragging,
  className,
}: LinkCardProps) {
  const domain = new URL(url).hostname.replace("www.", "")

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative group bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 cursor-pointer tap-highlight-transparent transition-all",
        isDragging && "opacity-50",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="drag-handle cursor-move p-1 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
          {favicon ? (
            <img 
              src={favicon} 
              alt="" 
              className="w-6 h-6 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <ExternalLink className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {title}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {domain}
          </p>
        </div>
        
        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
    </motion.div>
  )
}