"use client"

import { shareOrCopy } from "@/lib/share"

interface ShareButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  title: string
  text?: string | null
  /** Defaults to the current page. */
  url?: string
}

export function ShareButton({ title, text, url, children, ...props }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={() => shareOrCopy({ title, text: text || undefined, url: url || window.location.href })}
      {...props}
    >
      {children}
    </button>
  )
}
