// Slow, decorative movement for hero fields. Pure CSS (see .hero-drift in globals.css).

const SPECKS = [
  { x: 0.12, s: 5, d: 26, delay: -4 },
  { x: 0.3, s: 3, d: 21, delay: -15 },
  { x: 0.48, s: 7, d: 31, delay: -9 },
  { x: 0.66, s: 4, d: 24, delay: -20 },
  { x: 0.82, s: 6, d: 28, delay: -2 },
  { x: 0.92, s: 3, d: 19, delay: -11 },
]

export function HeroDrift() {
  return (
    <div className="hero-drift" aria-hidden>
      <i className="orb" />
      <i className="orb" />
      <i className="orb" />
      {SPECKS.map((p, i) => (
        <i
          key={i}
          className="speck"
          style={{ "--x": p.x, "--s": `${p.s}px`, "--d": `${p.d}s`, "--delay": `${p.delay}s` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
