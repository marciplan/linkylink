"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ExternalLink, GripVertical, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "./Avatar"

interface LinkCardProps {
  title: string
  url: string
  favicon?: string | null
  context?: string | null
  onClick?: () => void
  isDragging?: boolean
  showDragHandle?: boolean
  className?: string
  // User info for context messages
  userAvatar?: string | null
  username?: string
}

export function LinkCard({
  title,
  url,
  favicon,
  context,
  onClick,
  isDragging,
  showDragHandle = false,
  className,
  userAvatar,
  username,
}: LinkCardProps) {
  const [showContext, setShowContext] = useState(false)
  const domain = new URL(url).hostname.replace("www.", "")

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowContext(!showContext)
  }

  return (
    <motion.div
      animate={{ 
        scale: showContext ? 1.02 : 1,
      }}
      className={cn(
        "relative group bg-white rounded-lg border border-gray-200 transition-all overflow-hidden",
        isDragging && "opacity-50",
        showContext ? "border-gray-300 shadow-lg" : "hover:border-gray-300",
        className
      )}
    >
      {/* Main link content */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {showDragHandle && (
            <div className="drag-handle cursor-move p-1 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          )}
          
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
            {favicon ? (
              <Image 
                src={favicon} 
                alt="" 
                width={24}
                height={24}
                className="object-contain"
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
          
          <div className="flex items-center gap-2">
            {context && (
              <button
                onClick={handleInfoClick}
                className={cn(
                  "p-1.5 rounded-full transition-all flex-shrink-0",
                  showContext 
                    ? "bg-blue-100 text-blue-600" 
                    : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                )}
                title={showContext ? "Hide context" : "Show context"}
              >
                <Info className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={onClick}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md transition-all flex items-center gap-1"
              title="Visit link"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable context section */}
      <AnimatePresence>
        {showContext && context && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">              
              {/* iOS message-like context bubble */}
              <div className="bg-blue-500 text-white rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] ml-auto relative mb-2">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {context}
                </p>
                {/* iOS message tail */}
                <div className="absolute -bottom-1 right-4 w-4 h-4 bg-blue-500 transform rotate-45 rounded-br-sm"></div>
              </div>

              {/* User info below the message */}
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  {username || "Link creator"}
                </span>
                <Avatar 
                  src={userAvatar} 
                  username={username || "User"} 
                  size={24} 
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}