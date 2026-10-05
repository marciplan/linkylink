import React from "react"
import { cn } from "@/lib/utils"

export const inputStyles = cn(
  "w-full rounded-2xl border border-transparent bg-surface-2 px-4 text-[16px] text-ink placeholder:text-ink-3",
  "transition-colors outline-none focus:border-tint/60 focus:bg-surface focus:ring-4 focus:ring-tint/15",
  "disabled:opacity-50"
)

interface FieldProps {
  label: string
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
  className?: string
  htmlFor?: string
}

/** Label + control + hint/error stack. Inputs use 16px text so iOS never zooms. */
export function Field({ label, hint, error, children, className, htmlFor }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block px-1 text-[13px] font-semibold text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p className="px-1 text-[13px] font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="px-1 text-[13px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputStyles, "h-12", className)} {...props} />
  }
)

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(inputStyles, "resize-none py-3 leading-snug", className)} {...props} />
  }
)
