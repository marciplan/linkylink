"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, GripVertical, ThumbsUp, MessageCircle, Trash2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "./Avatar"
import { addComment, getComments, deleteComment } from "@/lib/actions"

interface CommentData {
  id: string
  content: string
  createdAt: Date
  user: { username: string; image: string | null }
}

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
  // Likes
  likes?: number
  onLike?: () => void
  // Comments
  linkId?: string
  currentUser?: { id: string; username: string; image?: string | null } | null
  commentCount?: number
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
  likes = 0,
  onLike,
  linkId,
  currentUser,
  commentCount = 0,
}: LinkCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const [localLikes, setLocalLikes] = useState(likes)
  const [isLiking, setIsLiking] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentData[]>([])
  const [localCommentCount, setLocalCommentCount] = useState(commentCount)
  const [commentText, setCommentText] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Total count includes the owner's context as a pinned comment
  const totalCount = localCommentCount + (context ? 1 : 0)

  const domain = (() => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url || "Invalid URL"
    }
  })()

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLiking) return

    setIsLiking(true)
    setShouldAnimate(true)

    // Reset animation state after animation completes
    setTimeout(() => {
      setShouldAnimate(false)
      setLocalLikes(prev => prev + 1)
    }, 400)

    if (onLike) {
      await onLike()
    }

    setIsLiking(false)
  }

  const [hasLoadedComments, setHasLoadedComments] = useState(false)

  const handleCommentToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showComments && linkId && !hasLoadedComments) {
      setIsLoadingComments(true)
      try {
        const fetched = await getComments(linkId)
        setComments(fetched)
        setHasLoadedComments(true)
      } catch {
        // ignore
      }
      setIsLoadingComments(false)
    }
    setShowComments(!showComments)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkId || !commentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const comment = await addComment({ linkId, content: commentText.trim() })
      setComments([...comments, comment])
      setLocalCommentCount(prev => prev + 1)
      setCommentText("")
    } catch {
      // ignore
    }
    setIsSubmitting(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId))
      setLocalCommentCount(prev => prev - 1)
    } catch {
      // ignore
    }
  }

  return (
    <motion.div
      animate={{
        scale: shouldReduceMotion ? 1 : (showComments ? 1.02 : 1),
      }}
      className={cn(
        "relative group bg-white rounded-lg border border-gray-200 transition-all overflow-hidden",
        isDragging && "opacity-50",
        showComments ? "border-gray-300 shadow-lg" : "hover:border-gray-300",
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
                alt={`${title} favicon`}
                width={24}
                height={24}
                className="object-contain"
                unoptimized
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  // Show fallback icon when image fails
                  const parent = target.parentElement
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallbackIcon = document.createElement('div')
                    fallbackIcon.className = 'fallback-icon w-5 h-5 text-gray-400'
                    fallbackIcon.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>'
                    parent.appendChild(fallbackIcon)
                  }
                }}
              />
            ) : (
              <Image
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                alt=""
                width={24}
                height={24}
                className="object-contain"
                unoptimized
              />
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
            <button
              onClick={handleLikeClick}
              disabled={isLiking}
              className="p-1.5 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all flex-shrink-0 flex items-center gap-1"
              title="Like this link"
            >
              <motion.span
                animate={shouldAnimate && !shouldReduceMotion ? {
                  scale: [1, 1.3, 1],
                  rotate: [0, -15, 15, -10, 10, 0],
                } : {}}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="inline-flex"
              >
                <ThumbsUp className="w-4 h-4" />
              </motion.span>
              {localLikes > 0 && (
                <span className="text-xs font-medium">{localLikes}</span>
              )}
            </button>

            {linkId && (
              <button
                onClick={handleCommentToggle}
                className={cn(
                  "p-1.5 rounded-full transition-all flex-shrink-0 flex items-center gap-1",
                  showComments
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                )}
                title={showComments ? "Hide comments" : "Show comments"}
              >
                <MessageCircle className="w-4 h-4" />
                {totalCount > 0 && (
                  <span className="text-xs font-medium">{totalCount}</span>
                )}
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

      {/* Expandable comments section (includes owner context as pinned first comment) */}
      <AnimatePresence initial={!shouldReduceMotion}>
        {showComments && (
          <motion.div
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100">
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {/* Owner's context pinned at top */}
                {context && (
                  <div className="flex gap-2 px-4 py-3 bg-gray-50/70">
                    <Avatar
                      src={userAvatar}
                      username={username || "User"}
                      size={24}
                      className="flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium text-gray-900">@{username || "creator"}</span>
                        <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded-full">author</span>
                      </div>
                      <p className="text-sm text-gray-700 break-words">{context}</p>
                    </div>
                  </div>
                )}

                {/* User comments */}
                {isLoadingComments ? (
                  <p className="text-xs text-gray-400 py-4 text-center">Loading comments...</p>
                ) : comments.length === 0 && !context ? (
                  <p className="text-xs text-gray-400 py-4 text-center px-4">
                    {currentUser ? "Be the first to share your thoughts on this link" : "No comments yet — log in to be the first"}
                  </p>
                ) : (
                  comments.map((comment, index) => {
                    // Offset index by 1 if context exists (context takes the first "row")
                    const rowIndex = context ? index + 1 : index
                    return (
                    <div key={comment.id} className={cn("flex gap-2 items-start group/comment px-4 py-3", rowIndex % 2 === 1 ? "bg-gray-50/70" : "")}>
                      <Avatar
                        src={comment.user.image}
                        username={comment.user.username}
                        size={24}
                        className="flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-gray-900">@{comment.user.username}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 break-words">{comment.content}</p>
                      </div>
                      {currentUser && (currentUser.username === comment.user.username || currentUser.username === username) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="flex-shrink-0 mt-0.5 p-1 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    )
                  })
                )}
              </div>

              {/* Comment input - only for logged-in users */}
              {currentUser ? (
                <form onSubmit={handleSubmitComment} className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                  <Avatar
                    src={currentUser.image}
                    username={currentUser.username}
                    size={24}
                    className="flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    maxLength={500}
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <p className="text-xs text-gray-400 px-4 py-3 border-t border-gray-100 text-center">
                  <Link href="/login" className="text-blue-500 hover:underline">Log in</Link> to leave a comment
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
