import Image from "next/image"
import { FluentEmoji } from "@/components/FluentEmoji"
import { toneProps, type Tone } from "@/lib/tone"
import type { BundelIcon } from "@/lib/bundel-icon"
import { cn } from "@/lib/utils"

interface BundelHeroProps {
  tone: Tone
  headerImage?: string | null
  icon: BundelIcon
  /** Rendered on the icon tile so owners can tap it to change the look. */
  iconAction?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  meta?: React.ReactNode
}

/**
 * The icon in its tonal tile. "chip" is the pale identity tile used on a hero;
 * "tile" is the soft tile used in lists, where the page background does the contrast.
 */
export function BundelIconTile({ icon, tone, size = 72, variant = "chip" }: { icon: BundelIcon; tone: Tone; size?: number; variant?: "chip" | "tile" }) {
  const props = toneProps(tone)
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[30%]",
        variant === "chip" ? "tone-chip" : "tone-tile shadow-card ring-1 ring-black/5 dark:ring-white/10"
      )}
      style={{ ...props.style, width: size, height: size }}
      data-ink={props["data-ink"]}
    >
      {icon.kind === "emoji" ? (
        <FluentEmoji emoji={icon.value} size={Math.round(size * 0.62)} className="drop-shadow-sm" />
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
export function BundelHero({ tone, headerImage, icon, iconAction, title, subtitle, meta }: BundelHeroProps) {
  return (
    <section className="grain relative isolate overflow-hidden text-white lg:sticky lg:top-0 lg:flex lg:h-dvh">
      <div className="tone-hero absolute inset-0 -z-10" {...toneProps(tone)}>
        {headerImage && (
          <Image src={headerImage} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/55" />
      </div>
      <div className="mx-auto flex min-h-[320px] max-w-2xl flex-col justify-end px-5 pb-12 pt-[calc(env(safe-area-inset-top)+76px)] sm:min-h-[360px] lg:min-h-0 lg:max-w-none lg:flex-1 lg:px-10 lg:pb-32">
        <div className="relative w-fit animate-rise">
          <BundelIconTile icon={icon} tone={tone} />
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
