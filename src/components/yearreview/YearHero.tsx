import Image from "next/image"
import { bundelGradient } from "@/lib/theme"

interface YearHeroProps {
  hue: number
  year: number | null
  headerImage?: string | null
  title: React.ReactNode
  subtitle?: React.ReactNode
  meta?: React.ReactNode
}

/**
 * The opening frame of a Year Review: the year itself, set huge, on the
 * Bundel's gradient with film grain. Everything else is quiet around it.
 */
export function YearHero({ hue, year, headerImage, title, subtitle, meta }: YearHeroProps) {
  return (
    <section className="grain relative overflow-hidden text-white">
      <div className="absolute inset-0 -z-10" style={{ background: bundelGradient(hue) }}>
        {headerImage && <Image src={headerImage} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/60" />
      </div>
      <div className="mx-auto flex min-h-[420px] max-w-2xl flex-col justify-end px-5 pb-14 pt-[calc(env(safe-area-inset-top)+80px)] sm:min-h-[460px]">
        <p className="animate-rise text-[13px] font-semibold uppercase tracking-[0.22em] text-white/80">The year in review</p>
        <p
          aria-hidden={!year}
          className="animate-rise font-black leading-[0.82] tracking-[-0.06em] [animation-delay:60ms] [text-shadow:0_6px_40px_rgb(0_0_0/0.28)]"
          style={{ fontSize: "clamp(6.5rem, 34vw, 11rem)" }}
        >
          {year ?? "—"}
        </p>
        <div className="mt-5 animate-rise [animation-delay:120ms] [text-shadow:0_1px_14px_rgb(0_0_0/0.25)]">
          <h1 className="text-title text-balance text-[28px] sm:text-[34px]">{title}</h1>
          {subtitle && <div className="mt-1.5 text-[17px] leading-snug text-white/90 text-pretty">{subtitle}</div>}
          {meta && <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-white/80">{meta}</div>}
        </div>
      </div>
    </section>
  )
}
