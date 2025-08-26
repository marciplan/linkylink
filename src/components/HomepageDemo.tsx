"use client"

import { motion } from "framer-motion"
import { ExternalLink, User, Eye, Calendar } from "lucide-react"
import Image from "next/image"

const demoLinks = [
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
  },
]

export function HomepageDemo() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-20 relative"
    >
      {/* Phone mockup */}
      <div className="relative max-w-sm mx-auto">
        {/* Phone frame */}
        <div className="relative mx-auto w-full">
          <motion.div 
            className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Screen */}
            <div className="bg-white rounded-[2rem] p-6 h-[600px] overflow-hidden">
              {/* Status bar */}
              <div className="flex justify-between items-center mb-6 text-xs text-gray-600">
                <span>9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                  <div className="w-1 h-3 bg-gray-300 rounded-sm"></div>
                  <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                </div>
              </div>

              {/* Profile section */}
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-4"
                  animate={{ 
                    background: [
                      "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
                      "linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)",
                      "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.h3 
                  className="font-semibold text-lg text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  My favorite web videos
                </motion.h3>
                <motion.div 
                  className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    @marciplan
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    64 views
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    August 2, 2024
                  </span>
                </motion.div>
              </motion.div>

              {/* Links */}
              <div className="space-y-3">
                {demoLinks.map((link, index) => {
                  return (
                    <motion.div
                      key={link.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-100"
                            whileHover={{ rotate: 5 }}
                          >
                            <Image
                              src={link.favicon}
                              alt=""
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          </motion.div>
                          <div className="text-left">
                            <div className="font-medium text-gray-900 text-sm">{link.title}</div>
                            <div className="text-xs text-gray-500">{link.platform}</div>
                          </div>
                        </div>
                        <motion.div
                          initial={{ opacity: 0.5 }}
                          whileHover={{ opacity: 1, x: 2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Floating badge */}
              <motion.div
                className="absolute top-4 right-4 bg-black text-white text-xs px-3 py-1.5 rounded-full font-medium"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
              >
                Live Preview
              </motion.div>
            </div>
          </motion.div>

          {/* Decorative elements */}
          <motion.div
            className="absolute -top-10 -right-10 w-20 h-20 bg-gray-100 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-32 h-32 bg-gray-50 rounded-full"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Caption */}
      <motion.p
        className="text-center text-sm text-gray-500 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        Share all your links in seconds
      </motion.p>
    </motion.div>
  )
}