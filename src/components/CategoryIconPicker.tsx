"use client"

import { useState } from "react"
import * as LucideIcons from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

// Curated list of icons suitable for year review categories
export const CATEGORY_ICONS = [
  // General
  "Star", "Heart", "Award", "Trophy", "Medal", "Crown", "Gem", "Sparkles",
  // Tech & Web
  "Globe", "Monitor", "Laptop", "Smartphone", "Tablet", "Cpu", "Code", "Terminal",
  // Media & Content
  "Film", "Music", "Headphones", "Camera", "Video", "Mic", "Radio", "Tv",
  // Food & Drink
  "Coffee", "Pizza", "Utensils", "Wine", "Beer", "Cake", "Cookie", "IceCream",
  // Travel & Places
  "Plane", "Car", "Train", "Ship", "MapPin", "Mountain", "Palmtree", "Tent",
  // Shopping & Business
  "ShoppingBag", "ShoppingCart", "Store", "CreditCard", "Wallet", "DollarSign", "Briefcase", "Building",
  // Health & Fitness
  "Dumbbell", "Heart", "Activity", "Apple", "Salad", "Pill", "Stethoscope",
  // Entertainment & Games
  "Gamepad", "Dice1", "Puzzle", "Joystick", "Clapperboard", "Popcorn", "Drama",
  // Books & Learning
  "Book", "BookOpen", "GraduationCap", "Library", "Notebook", "PenTool", "Lightbulb",
  // Social & People
  "Users", "User", "Baby", "Dog", "Cat", "Bird", "MessageCircle", "Share2",
  // Nature & Weather
  "Sun", "Moon", "Cloud", "Snowflake", "Leaf", "Flower", "TreeDeciduous",
  // Tools & Work
  "Wrench", "Hammer", "Scissors", "Paintbrush", "Palette", "Brush",
  // Sports
  "Bike", "Trophy", "Target", "Flag", "Timer",
  // Misc
  "Gift", "Package", "Box", "Archive", "Folder", "Clock", "Calendar", "Zap",
  // Thumbs
  "ThumbsUp", "ThumbsDown"
] as const

export type CategoryIconName = typeof CATEGORY_ICONS[number]

// Icon suggestion based on category name keywords
const ICON_KEYWORDS: Record<string, CategoryIconName> = {
  // Food & Drink
  "coffee": "Coffee",
  "cafe": "Coffee",
  "tea": "Coffee",
  "restaurant": "Utensils",
  "food": "Utensils",
  "pizza": "Pizza",
  "wine": "Wine",
  "beer": "Beer",
  "drink": "Wine",
  "cake": "Cake",
  "dessert": "Cake",
  "ice cream": "IceCream",
  "icecream": "IceCream",

  // Tech
  "website": "Globe",
  "web": "Globe",
  "app": "Smartphone",
  "software": "Monitor",
  "tool": "Wrench",
  "tech": "Cpu",
  "computer": "Laptop",
  "phone": "Smartphone",
  "game": "Gamepad",
  "gaming": "Gamepad",
  "code": "Code",
  "programming": "Terminal",

  // Media
  "movie": "Film",
  "film": "Film",
  "show": "Tv",
  "tv": "Tv",
  "series": "Tv",
  "music": "Music",
  "song": "Music",
  "album": "Music",
  "podcast": "Mic",
  "video": "Video",
  "youtube": "Video",
  "photo": "Camera",
  "photography": "Camera",

  // Books & Learning
  "book": "Book",
  "read": "BookOpen",
  "article": "Notebook",
  "blog": "PenTool",
  "course": "GraduationCap",
  "learn": "Lightbulb",

  // Travel
  "travel": "Plane",
  "trip": "Plane",
  "vacation": "Palmtree",
  "destination": "MapPin",
  "place": "MapPin",
  "hotel": "Building",
  "flight": "Plane",
  "car": "Car",
  "drive": "Car",

  // Shopping
  "product": "ShoppingBag",
  "shop": "Store",
  "buy": "ShoppingCart",
  "purchase": "CreditCard",
  "brand": "Award",

  // Health & Fitness
  "gym": "Dumbbell",
  "workout": "Dumbbell",
  "exercise": "Activity",
  "health": "Heart",
  "fitness": "Dumbbell",

  // Entertainment
  "entertainment": "Clapperboard",
  "sport": "Trophy",
  "team": "Users",

  // People & Social
  "people": "Users",
  "friend": "Users",
  "influencer": "User",
  "creator": "Sparkles",

  // Nature
  "nature": "Leaf",
  "outdoor": "Mountain",
  "camping": "Tent",
  "hike": "Mountain",

  // Default categories
  "favorite": "Heart",
  "best": "Star",
  "top": "Trophy",
  "worst": "ThumbsDown",
}

export function suggestIcon(categoryName: string): CategoryIconName {
  const lowerName = categoryName.toLowerCase()

  // Check for keyword matches
  for (const [keyword, icon] of Object.entries(ICON_KEYWORDS)) {
    if (lowerName.includes(keyword)) {
      return icon
    }
  }

  // Default icon
  return "Star"
}

interface CategoryIconPickerProps {
  selectedIcon: CategoryIconName
  onSelect: (icon: CategoryIconName) => void
  isOpen: boolean
  onClose: () => void
}

export function CategoryIconPicker({ selectedIcon, onSelect, isOpen, onClose }: CategoryIconPickerProps) {
  const [search, setSearch] = useState("")

  const filteredIcons = search
    ? CATEGORY_ICONS.filter(icon => icon.toLowerCase().includes(search.toLowerCase()))
    : CATEGORY_ICONS

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Icon</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-6 gap-2">
                {filteredIcons.map((iconName) => {
                  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>
                  if (!IconComponent) return null

                  return (
                    <button
                      key={iconName}
                      onClick={() => {
                        onSelect(iconName)
                        onClose()
                      }}
                      className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                        selectedIcon === iconName
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                      title={iconName}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface CategoryIconProps {
  icon: CategoryIconName
  className?: string
}

export function CategoryIcon({ icon, className = "w-5 h-5" }: CategoryIconProps) {
  const IconComponent = LucideIcons[icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>
  if (!IconComponent) {
    const Star = LucideIcons.Star
    return <Star className={className} />
  }
  return <IconComponent className={className} />
}
