"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, User, Eye } from "lucide-react"
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
  links: DemoLink[]
}

// Background gradients for side cards
const cardBackgrounds = [
  "bg-gradient-to-br from-rose-100 to-pink-200",
  "bg-gradient-to-br from-blue-100 to-indigo-200",
  "bg-gradient-to-br from-emerald-100 to-teal-200",
  "bg-gradient-to-br from-amber-100 to-orange-200",
  "bg-gradient-to-br from-violet-100 to-purple-200",
]

const demoExamples: DemoExample[] = [
  {
    bundleTitle: "My favorite music videos",
    username: "@marciplan",
    views: 64,
    date: "August 2, 2024",
    links: [
      {
        title: "Fred Again - Boiler Room",
        favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
        platform: "YouTube"
      },
      {
        title: "Bon Iver at AIR Studios",
        favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
        platform: "YouTube"
      },
      {
        title: "The Beatles - Rooftop Concert",
        favicon: "https://www.google.com/s2/favicons?domain=vimeo.com&sz=64",
        platform: "Vimeo"
      },
      {
        title: "Eric Prydz at Tomorrowland [2023]",
        favicon: "https://www.google.com/s2/favicons?domain=soundcloud.com&sz=64",
        platform: "SoundCloud"
      },
      {
        title: "Taylor Swift - Reputation",
        favicon: "https://www.google.com/s2/favicons?domain=netflix.com&sz=64",
        platform: "Netflix"
      }
    ]
  },
  {
    bundleTitle: "Which vacation should we book?",
    username: "@sarah_travels",
    views: 28,
    date: "November 15, 2024",
    message: "Let's vote on our summer trip! Budget is $2000/person, prefer somewhere warm with good food.",
    links: [
      {
        title: "Villa in Tuscany",
        platform: "Airbnb",
        favicon: "https://www.google.com/s2/favicons?domain=airbnb.com&sz=64"
      },
      {
        title: "All-inclusive Maldives resort",
        platform: "Booking.com",
        favicon: "https://www.google.com/s2/favicons?domain=booking.com&sz=64"
      },
      {
        title: "Backpacking through Vietnam",
        platform: "TripAdvisor",
        favicon: "https://www.google.com/s2/favicons?domain=tripadvisor.com&sz=64"
      },
      {
        title: "Cozy cabin in Norway",
        platform: "Vrbo",
        favicon: "https://www.google.com/s2/favicons?domain=vrbo.com&sz=64"
      }
    ]
  },
  {
    bundleTitle: "Team building activity - you choose!",
    username: "@tech_team",
    views: 42,
    date: "November 20, 2024",
    message: "Friday afternoon team building - what sounds fun? We have 12 people and a $500 budget.",
    links: [
      {
        title: "Escape room downtown",
        platform: "Eventbrite",
        favicon: "https://www.google.com/s2/favicons?domain=eventbrite.com&sz=64"
      },
      {
        title: "Italian cooking class",
        platform: "Cozymeal",
        favicon: "https://www.google.com/s2/favicons?domain=cozymeal.com&sz=64"
      },
      {
        title: "Bowling tournament",
        platform: "Yelp",
        favicon: "https://www.google.com/s2/favicons?domain=yelp.com&sz=64"
      },
      {
        title: "Virtual murder mystery",
        platform: "TeamBuilding",
        favicon: "https://www.google.com/s2/favicons?domain=teambuilding.com&sz=64"
      }
    ]
  },
  {
    bundleTitle: "Anniversary dinner restaurant",
    username: "@couples_date",
    views: 15,
    date: "November 22, 2024",
    message: "Our 5th anniversary is next Saturday! Which place should we try?",
    links: [
      {
        title: "Michelin star French bistro",
        platform: "OpenTable",
        favicon: "https://www.google.com/s2/favicons?domain=opentable.com&sz=64"
      },
      {
        title: "Rooftop Italian with city views",
        platform: "Resy",
        favicon: "https://www.google.com/s2/favicons?domain=resy.com&sz=64"
      },
      {
        title: "Intimate sushi omakase",
        platform: "Yelp",
        favicon: "https://www.google.com/s2/favicons?domain=yelp.com&sz=64"
      },
      {
        title: "Farm-to-table countryside",
        platform: "Google Maps",
        favicon: "https://www.google.com/s2/favicons?domain=google.com&sz=64"
      }
    ]
  },
  {
    bundleTitle: "Book club picks for December",
    username: "@bookworms",
    views: 37,
    date: "November 25, 2024",
    message: "Vote for next month's read! We're doing cozy winter vibes.",
    links: [
      {
        title: "A Court of Thorns and Roses",
        platform: "Goodreads",
        favicon: "https://www.google.com/s2/favicons?domain=goodreads.com&sz=64"
      },
      {
        title: "The House in the Cerulean Sea",
        platform: "Amazon",
        favicon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=64"
      },
      {
        title: "Project Hail Mary",
        platform: "Audible",
        favicon: "https://www.google.com/s2/favicons?domain=audible.com&sz=64"
      },
      {
        title: "Lessons in Chemistry",
        platform: "Barnes & Noble",
        favicon: "https://www.google.com/s2/favicons?domain=barnesandnoble.com&sz=64"
      }
    ]
  }
]

function DemoContent({ example }: { example: DemoExample }) {
  return (
    <>
      {/* Profile section */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-4" />
        <h3 className="font-semibold text-lg text-gray-900">
          {example.bundleTitle}
        </h3>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {example.username}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {example.views} views
          </span>
        </div>
      </div>

      {/* Message/Context */}
      {example.message && (
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-700 leading-relaxed">
              {example.message}
            </p>
          </div>
        </div>
      )}

      {/* Links */}
      <div className="space-y-3">
        {example.links.slice(0, 4).map((link) => (
          <div
            key={link.title}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                <Image
                  src={link.favicon}
                  alt=""
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 text-xs truncate max-w-[180px]">{link.title}</div>
                <div className="text-[10px] text-gray-500">{link.platform}</div>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </div>
        ))}
      </div>
    </>
  )
}

// Card component for side items (no phone frame)
function SideCard({ example, index }: { example: DemoExample; index: number }) {
  const bgGradient = cardBackgrounds[index % cardBackgrounds.length]

  return (
    <div className="relative w-full">
      <div className={`${bgGradient} rounded-[2rem] p-1 shadow-xl`}>
        <div className="bg-white rounded-[1.75rem] p-6 h-[600px] overflow-hidden">
          <DemoContent example={example} />
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
        <div className="bg-white rounded-[2rem] p-6 h-[600px] overflow-hidden relative">
          {/* Status bar */}
          <div className="flex justify-between items-center mb-6 text-xs text-gray-600">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
              <div className="w-1 h-3 bg-gray-300 rounded-sm"></div>
              <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
            </div>
          </div>

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
              <SideCard example={example} index={index} />
            </motion.div>
          )
        })}

        {/* Fixed phone frame in center with animated content inside */}
        <div className="relative z-10">
          <PhoneFrameOverlay>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <DemoContent example={demoExamples[currentIndex]} />
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
