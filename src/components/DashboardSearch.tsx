"use client"

import { Loader2, Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

interface DashboardSearchProps {
  initialValue?: string
}

export function DashboardSearch({ initialValue = "" }: DashboardSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const handleSearch = (value: string) => {
    setSearch(value)
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set("search", value.trim())
      } else {
        params.delete("search")
      }
      router.replace(`/dashboard${params.size ? `?${params.toString()}` : ""}`, { scroll: false })
    })
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3" />
      <input
        type="search"
        enterKeyHint="search"
        placeholder="Search Bundels and links"
        aria-label="Search Bundels and links"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-11 w-full rounded-xl bg-ink/[0.06] pl-10 pr-10 text-[16px] outline-none placeholder:text-ink-3 focus:bg-ink/[0.08] focus:ring-2 focus:ring-tint/25 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2">
        {isPending ? (
          <Loader2 className="m-1.5 h-4 w-4 animate-spin text-ink-3" />
        ) : search ? (
          <button
            type="button"
            onClick={() => handleSearch("")}
            aria-label="Clear search"
            className="grid h-7 w-7 place-items-center rounded-full bg-ink-3/30 text-surface"
          >
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        ) : null}
      </span>
    </div>
  )
}
