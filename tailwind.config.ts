import type { Config } from "tailwindcss";

// Colors are OKLCH channel triplets defined as CSS variables in globals.css,
// so every token works with Tailwind's opacity modifier (e.g. bg-ink/10).
const token = (name: string) => `oklch(var(--${name}) / <alpha-value>)`

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        bg: token("bg"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        ink: token("ink"),
        "ink-2": token("ink-2"),
        "ink-3": token("ink-3"),
        line: token("line"),
        danger: token("danger"),
        tint: token("tint"),
        "tint-soft": token("tint-soft"),
        "tint-ink": token("tint-ink"),
        "tint-strong": token("tint-strong"),
      },
      fontSize: {
        display: ["clamp(1.875rem, 1.35rem + 2.4vw, 2.75rem)", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "700" }],
        title: ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "650" }],
      },
      borderRadius: {
        "4xl": "1.75rem",
      },
      boxShadow: {
        float: "0 1px 2px oklch(0 0 0 / 0.06), 0 8px 24px -6px oklch(0 0 0 / 0.14)",
        card: "0 1px 2px oklch(0 0 0 / 0.04), 0 1px 1px oklch(0 0 0 / 0.02)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.2, 0.9, 0.25, 1.15)",
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.23, 1, 0.32, 1) both",
        fade: "fade 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
