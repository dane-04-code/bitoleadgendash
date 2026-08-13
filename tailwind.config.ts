import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          DEFAULT: "hsl(var(--accent))",
          ink: "hsl(var(--accent-ink))",
          deep: "hsl(var(--accent-deep))",
          soft: "hsl(var(--accent-soft))",
          bg: "hsl(var(--accent-bg))",
        },
        flare: "hsl(var(--flare))",
        rail: {
          DEFAULT: "hsl(var(--rail))",
          hover: "hsl(var(--rail-hover))",
          active: "hsl(var(--rail-active))",
          edge: "hsl(var(--rail-edge))",
          ink: "hsl(var(--rail-ink))",
          2: "hsl(var(--rail-ink-2))",
          3: "hsl(var(--rail-ink-3))",
          mark: "hsl(var(--rail-mark))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          2: "hsl(var(--ink-2))",
          dim: "hsl(var(--ink-dim))",
          faint: "hsl(var(--ink-faint))",
          ghost: "hsl(var(--ink-ghost))",
        },
        bg: "hsl(var(--bg))",
        line: {
          DEFAULT: "hsl(var(--line))",
          soft: "hsl(var(--line-soft))",
          strong: "hsl(var(--line-strong))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
        },
        tier: {
          hot: "hsl(var(--tier-hot))",
          warm: "hsl(var(--tier-warm))",
          cold: "hsl(var(--tier-cold))",
        },
        stage: {
          new: "hsl(var(--stage-new))",
          listed: "hsl(var(--stage-listed))",
          assigned: "hsl(var(--stage-assigned))",
          contacted: "hsl(var(--stage-contacted))",
          meeting: "hsl(var(--stage-meeting))",
          quote: "hsl(var(--stage-quote))",
          won: "hsl(var(--stage-won))",
          dead: "hsl(var(--stage-dead))",
          returned: "hsl(var(--stage-returned))",
        },
        heat: {
          high: "hsl(var(--heat-high))",
          mid: "hsl(var(--heat-mid))",
          low: "hsl(var(--heat-low))",
        },
        signal: {
          hot: "hsl(var(--hot))",
          warm: "hsl(var(--warm))",
          cold: "hsl(var(--cold))",
          good: "hsl(var(--good))",
        },
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        lg: "var(--radius)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "rise": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "rise": "rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
