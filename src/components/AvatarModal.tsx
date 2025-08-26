"use client"

import { useState } from "react"
import { X, User } from "lucide-react"
import Image from "next/image"

interface AvatarModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatar?: string | null
  onSave: (avatarUrl: string | null) => void
}

export function AvatarModal({ isOpen, onClose, currentAvatar, onSave }: AvatarModalProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || "")
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(avatarUrl.trim() || null)
      onClose()
    } catch (error) {
      console.error("Failed to update avatar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    setIsLoading(true)
    try {
      await onSave(null)
      setAvatarUrl("")
      onClose()
    } catch (error) {
      console.error("Failed to remove avatar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Update Avatar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste a URL to an image. Leave empty to use the default avatar.
            </p>
          </div>

          {currentAvatar && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Current avatar:</p>
              <Image
                src={currentAvatar}
                alt="Current avatar"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full mx-auto object-cover border border-gray-200"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
          {currentAvatar && (
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}