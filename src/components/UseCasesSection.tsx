"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface Link {
  title: string
  platform: string
  favicon: string
}

interface UseCase {
  title: string
  emoji: string
  message?: string
  links: Link[]
}

const useCases: UseCase[] = [
  {
    title: "Which vacation should we book?",
    emoji: "🏖️",
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
    title: "Birthday gift ideas for Dad",
    emoji: "🎁",
    links: [
      {
        title: "Vintage record player",
        platform: "Etsy",
        favicon: "https://www.google.com/s2/favicons?domain=etsy.com&sz=64"
      },
      {
        title: "Premium golf club set",
        platform: "Amazon",
        favicon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=64"
      },
      {
        title: "Whiskey tasting experience",
        platform: "Eventbrite",
        favicon: "https://www.google.com/s2/favicons?domain=eventbrite.com&sz=64"
      },
      {
        title: "Noise-canceling headphones",
        platform: "Best Buy",
        favicon: "https://www.google.com/s2/favicons?domain=bestbuy.com&sz=64"
      }
    ]
  },
  {
    title: "Team building activity - you choose!",
    emoji: "🎯",
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
    title: "Anniversary dinner restaurant",
    emoji: "🍷",
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
  }
]

export function UseCasesSection() {
  return (
    <section className="w-full py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-medium text-gray-900 mb-4">
            Perfect for any decision
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share options, let others choose. From vacation planning to team activities.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, caseIndex) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: caseIndex * 0.1 }}
              className="group"
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                {/* Card Header */}
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-2xl">{useCase.emoji}</span>
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {useCase.title}
                  </h3>
                </div>

                {/* Message/Context */}
                {useCase.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: caseIndex * 0.1 + 0.2 }}
                    className="mb-4"
                  >
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {useCase.message}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Links List */}
                <div className="space-y-2">
                  {useCase.links.map((link, linkIndex) => (
                    <motion.div
                      key={link.title}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.3,
                        delay: caseIndex * 0.1 + linkIndex * 0.05
                      }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all"
                    >
                      <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                        <Image
                          src={link.favicon}
                          alt=""
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {link.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {link.platform}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
