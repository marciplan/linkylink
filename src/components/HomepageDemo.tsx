"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Eye, Search, Calendar, AtSign, Plus, Share } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

interface DemoLink {
  title: string
  favicon: string
  platform: string
}

interface DemoExample {
  bundleTitle: string
  username: string
  views: number
  date: string
  message?: string
  emoji: string
  gradient: string
  links: DemoLink[]
}

const demoExamples: DemoExample[] = [
  {
    bundleTitle: "My favorite music videos",
    username: "marciplan",
    views: 64,
    date: "08/02/2024",
    emoji: "🎵",
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    links: [
      {
        title: "Fred Again - Boiler Room",
        favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
        platform: "youtube.com"
      },
      {
        title: "Bon Iver at AIR Studios",
        favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
        platform: "youtube.com"
      },
      {
        title: "The Beatles - Rooftop Concert",
        favicon: "https://www.google.com/s2/favicons?domain=vimeo.com&sz=64",
        platform: "vimeo.com"
      },
      {
        title: "Eric Prydz at Tomorrowland",
        favicon: "https://www.google.com/s2/favicons?domain=soundcloud.com&sz=64",
        platform: "soundcloud.com"
      }
    ]
  },
  {
    bundleTitle: "Which vacation should we book?",
    username: "sarah_travels",
    views: 28,
    date: "11/15/2024",
    emoji: "✈️",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    message: "Let's vote on our summer trip!",
    links: [
      {
        title: "Villa in Tuscany",
        platform: "airbnb.com",
        favicon: "https://www.google.com/s2/favicons?domain=airbnb.com&sz=64"
      },
      {
        title: "All-inclusive Maldives resort",
        platform: "booking.com",
        favicon: "https://www.google.com/s2/favicons?domain=booking.com&sz=64"
      },
      {
        title: "Cozy cabin in Norway",
        platform: "vrbo.com",
        favicon: "https://www.google.com/s2/favicons?domain=vrbo.com&sz=64"
      },
      {
        title: "Backpacking through Vietnam",
        platform: "tripadvisor.com",
        favicon: "https://www.google.com/s2/favicons?domain=tripadvisor.com&sz=64"
      }
    ]
  },
  {
    bundleTitle: "Team building activity",
    username: "tech_team",
    views: 42,
    date: "11/20/2024",
    emoji: "🎯",
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    message: "Friday team building - what sounds fun?",
    links: [
      {
        title: "Escape room downtown",
        platform: "eventbrite.com",
        favicon: "https://www.google.com/s2/favicons?domain=eventbrite.com&sz=64"
      },
      {
        title: "Italian cooking class",
        platform: "cozymeal.com",
        favicon: "https://www.google.com/s2/favicons?domain=cozymeal.com&sz=64"
      },
      {
        title: "Bowling tournament",
        platform: "yelp.com",
        favicon: "https://www.google.com/s2/favicons?domain=yelp.com&sz=64"
      },
      {
        title: "Virtual murder mystery",
        platform: "teambuilding.com",
        favicon: "https://www.google.com/s2/favicons?domain=teambuilding.com&sz=64"
      }
    ]
  },
  {
    bundleTitle: "Anniversary dinner spots",
    username: "couples_date",
    views: 15,
    date: "11/22/2024",
    emoji: "💕",
    gradient: "from-rose-400 via-pink-500 to-purple-500",
    message: "Our 5th anniversary is next Saturday!",
    links: [
      {
        title: "Michelin star French bistro",
        platform: "opentable.com",
        favicon: "https://www.google.com/s2/favicons?domain=opentable.com&sz=64"
      },
      {
        title: "Rooftop Italian with city views",
        platform: "resy.com",
        favicon: "https://www.google.com/s2/favicons?domain=resy.com&sz=64"
      },
      {
        title: "Intimate sushi omakase",
        platform: "yelp.com",
        favicon: "https://www.google.com/s2/favicons?domain=yelp.com&sz=64"
      },
      {
        title: "Farm-to-table countryside",
        platform: "google.com",
        favicon: "https://www.google.com/s2/favicons?domain=google.com&sz=64"
      }
    ]
  },
  {
    bundleTitle: "Book club picks",
    username: "bookworms",
    views: 37,
    date: "11/25/2024",
    emoji: "📚",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    message: "Vote for next month's read!",
    links: [
      {
        title: "A Court of Thorns and Roses",
        platform: "goodreads.com",
        favicon: "https://www.google.com/s2/favicons?domain=goodreads.com&sz=64"
      },
      {
        title: "The House in the Cerulean Sea",
        platform: "amazon.com",
        favicon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=64"
      },
      {
        title: "Project Hail Mary",
        platform: "audible.com",
        favicon: "https://www.google.com/s2/favicons?domain=audible.com&sz=64"
      },
      {
        title: "Lessons in Chemistry",
        platform: "barnesandnoble.com",
        favicon: "https://www.google.com/s2/favicons?domain=barnesandnoble.com&sz=64"
      }
    ]
  }
]

function DemoContent({ example, radius = "2rem" }: { example: DemoExample; radius?: string }) {
  return (
    <div className="h-[600px] flex flex-col">
      {/* Gradient header section */}
      <div
        className={`bg-gradient-to-br ${example.gradient} px-4 pt-4 pb-6 relative`}
        style={{ borderTopLeftRadius: radius, borderTopRightRadius: radius }}
      >
        {/* Top bar with Bundel logo and search */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/90 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1">
            <span className="text-[10px] font-medium text-gray-700">Bundel</span>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-lg p-1.5">
            <Search className="w-3 h-3 text-gray-600" />
          </div>
        </div>

        {/* Emoji icon */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur rounded-full flex items-center justify-center border-2 border-white/40">
            <span className="text-2xl">{example.emoji}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-center font-semibold text-white text-base mb-1">
          {example.bundleTitle}
        </h3>

        {/* Message */}
        {example.message && (
          <p className="text-center text-white/80 text-[10px] mb-3">
            {example.message}
          </p>
        )}

        {/* Metadata badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur text-white text-[9px] px-2 py-0.5 rounded-full">
            <AtSign className="w-2.5 h-2.5" />
            {example.username}
          </span>
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur text-white text-[9px] px-2 py-0.5 rounded-full">
            <Eye className="w-2.5 h-2.5" />
            {example.views}
          </span>
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur text-white text-[9px] px-2 py-0.5 rounded-full">
            <Calendar className="w-2.5 h-2.5" />
            {example.date}
          </span>
        </div>
      </div>

      {/* Links section */}
      <div className="flex-1 bg-gray-50 px-4 py-3 flex flex-col overflow-hidden">
        <div className="space-y-2 flex-1">
          {example.links.map((link) => (
            <div
              key={link.title}
              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                  <Image
                    src={link.favicon}
                    alt=""
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-[11px] truncate max-w-[140px]">{link.title}</div>
                  <div className="text-[9px] text-gray-500">{link.platform}</div>
                </div>
              </div>
              <span className="text-[9px] text-gray-500 flex items-center gap-1">
                Visit <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-3 space-y-2">
          <button className="w-full bg-gray-700 border border-gray-900 text-white text-[10px] font-medium h-8 rounded-lg flex items-center justify-center gap-1.5">
            <Plus className="w-3 h-3" />
            Add Link
          </button>

          <button className="w-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-medium h-8 rounded-lg flex items-center justify-center gap-1.5">
            <Share className="w-3 h-3" />
            Share Bundel
          </button>
        </div>
      </div>
    </div>
  )
}

// Card component for side items (no phone frame)
function SideCard({ example }: { example: DemoExample }) {
  return (
    <div className="relative w-full">
      <div className="bg-gray-200 rounded-[2rem] p-1 shadow-xl">
        <div className="bg-white rounded-[1.75rem] overflow-hidden h-[600px]">
          <DemoContent example={example} radius="1.75rem" />
        </div>
      </div>
    </div>
  )
}

// Static phone frame overlay (always in center)
function PhoneFrameOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[320px]">
      <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden relative h-[600px]">
          {children}
        </div>
      </div>
    </div>
  )
}

export function HomepageDemo() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % demoExamples.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Get the index with wrapping
  const getWrappedIndex = (index: number) => {
    return ((index % demoExamples.length) + demoExamples.length) % demoExamples.length
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-20 relative w-full"
    >
      {/* Carousel Container */}
      <div className="relative h-[700px] flex items-center justify-center">
        {/* Side cards - 2 left, 2 right (animate) */}
        {[-2, -1, 1, 2].map((offset) => {
          const index = getWrappedIndex(currentIndex + offset)
          const example = demoExamples[index]
          const isInner = Math.abs(offset) === 1

          // Graduated scaling: inner 0.75, outer 0.55
          const scale = isInner ? 0.75 : 0.55
          // Graduated opacity: inner 0.6, outer 0.35
          const opacity = isInner ? 0.6 : 0.35
          // Z-index layering (below center phone frame)
          const zIndex = isInner ? 5 : 1
          // Tighter spacing so all 5 cards fit
          const xOffset = offset * 55

          return (
            <motion.div
              key={index}
              className="absolute"
              initial={false}
              animate={{
                x: `${xOffset}%`,
                scale,
                opacity,
                zIndex
              }}
              transition={{
                duration: 0.7,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{
                width: "320px",
                pointerEvents: "none"
              }}
            >
              <SideCard example={example} />
            </motion.div>
          )
        })}

        {/* Fixed phone frame in center with animated content inside */}
        <div className="relative z-10">
          <PhoneFrameOverlay>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentIndex}
                className="h-[600px]"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <DemoContent example={demoExamples[currentIndex]} radius="2rem" />
              </motion.div>
            </AnimatePresence>
          </PhoneFrameOverlay>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {demoExamples.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-gray-900"
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to example ${index + 1}`}
          />
        ))}
      </div>

      {/* Caption */}
      <motion.p
        className="text-center text-sm text-gray-500 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        Share all your links in seconds
      </motion.p>
    </motion.div>
  )
}
