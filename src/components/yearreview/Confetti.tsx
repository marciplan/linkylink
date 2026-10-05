"use client"

import { useEffect } from "react"

/**
 * One burst of confetti the first time the #1 pick scrolls into view.
 * Skipped for people who prefer reduced motion, and only ever once per page load.
 */
export default function ConfettiOnView({ targetId, hue }: { targetId: string; hue: number }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const target = document.getElementById(targetId)
    if (!target) return

    let fired = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || fired) return
        fired = true
        io.disconnect()
        burst(target.getBoundingClientRect(), hue)
      },
      { threshold: 0.7 }
    )
    io.observe(target)
    return () => io.disconnect()
  }, [targetId, hue])

  return null
}

function burst(rect: DOMRect, hue: number) {
  const canvas = document.createElement("canvas")
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "70" })
  canvas.setAttribute("aria-hidden", "true")
  document.body.appendChild(canvas)
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas.remove()
  ctx.scale(dpr, dpr)

  const colors = [0, 40, 80, 200, 260, 320].map((o) => `hsl(${(hue + o) % 360} 90% 62%)`)
  const cx = rect.left + rect.width / 2
  const cy = Math.min(Math.max(rect.top + rect.height * 0.25, 80), window.innerHeight - 120)
  const parts = Array.from({ length: 70 }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 7
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 5,
      w: 5 + Math.random() * 6, h: 3 + Math.random() * 5,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }
  })

  const start = performance.now()
  const frame = (now: number) => {
    const t = (now - start) / 1000
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const p of parts) {
      p.vy += 0.28
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      ctx.save()
      ctx.globalAlpha = Math.max(0, 1 - t / 1.8)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (t < 1.8) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}
