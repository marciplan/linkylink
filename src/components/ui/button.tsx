import React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tint' | 'glass'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-bg hover:bg-ink/90',
  secondary: 'bg-surface-2 text-ink hover:bg-ink/10',
  ghost: 'text-ink-2 hover:bg-ink/5 hover:text-ink',
  danger: 'bg-danger/10 text-danger hover:bg-danger/15',
  tint: 'bg-tint-strong text-white hover:bg-tint-strong/90',
  glass: 'glass text-ink shadow-float',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-full',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-full',
  lg: 'h-14 px-6 text-base gap-2 rounded-2xl w-full',
  icon: 'h-11 w-11 rounded-full',
  'icon-sm': 'h-9 w-9 rounded-full',
}

/** Shared button styling, usable on <Link> and <a> as well as <button>. */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    'pressable inline-flex shrink-0 items-center justify-center font-semibold select-none',
    'disabled:pointer-events-none disabled:opacity-40',
    variants[variant],
    sizes[size],
    className
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />
}
