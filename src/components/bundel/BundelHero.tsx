import Image from "next/image"
import { bundelGradient } from "@/lib/theme"
import type { BundelIcon } from "@/lib/bundel-icon"

interface BundelHeroProps {
  hue: number
  headerImage?: string | null
  icon: BundelIcon
  /** Rendered on the icon tile so owners can tap it to change the look. */
  iconAction?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  meta?: React.ReactNode
}

export function BundelIconTile({ icon, size = 72 }: { icon: BundelIcon; size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[30%] bg-white/25 shadow-lg ring-1 ring-white/50 backdrop-blur-md"
      style={{ width: size, height: size }}
    >
      {icon.kind === "emoji" ? (
        <span style={{ fontSize: size * 0.52, lineHeight: 1 }} aria-hidden>
          {icon.value}
        </span>
      ) : (
        <Image src={icon.value} alt="" fill sizes={`${size}px`} className="object-cover" />
      )}
    </span>
  )
}

/**
 * Full-bleed header: the Bundel's image or a generated mesh gradient, with the
 * title block anchored to the bottom where it is closest to the thumb.
 */
export function BundelHero({ hue, headerImage, icon, iconAction, title, subtitle, meta }: BundelHeroProps) {
  return (
    <section className="relative isolate overflow-hidden text-white">
      <div className="absolute inset-0 -z-10" style={{ background: bundelGradient(hue) }}>
        {headerImage && (
          <Image src={headerImage} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/55" />
      </div>
      <div className="mx-auto flex min-h-[320px] max-w-2xl flex-col justify-end px-5 pb-12 pt-[calc(env(safe-area-inset-top)+76px)] sm:min-h-[360px]">
        <div className="relative w-fit animate-rise">
          <BundelIconTile icon={icon} />
          {iconAction}
        </div>
        <div className="mt-5 animate-rise [animation-delay:60ms] [text-shadow:0_1px_12px_rgb(0_0_0/0.25)]">
          <h1 className="text-display text-balance">{title}</h1>
          {subtitle && <div className="mt-2 text-[17px] leading-snug text-white/90 text-pretty">{subtitle}</div>}
          {meta && <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-white/80">{meta}</div>}
        </div>
      </div>
    </section>
  )
}
