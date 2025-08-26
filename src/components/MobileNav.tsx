"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, User, Grid3x3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/directory", icon: Grid3x3, label: "Browse" },
  { href: "/create", icon: Plus, label: "Create", isPrimary: true },
  { href: "/dashboard", icon: User, label: "Profile" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative p-3"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="bg-gray-900 rounded-full p-3 hover:bg-gray-800 transition-colors"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-3 tap-highlight-transparent transition-colors",
                isActive ? "text-gray-900" : "text-gray-500"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-0.5 w-12 h-0.5 bg-gray-900 rounded-full"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}