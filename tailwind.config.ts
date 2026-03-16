import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        surface: {
          0: "hsl(var(--surface-0))",
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          dim: "hsl(var(--brand-dim))",
          fg: "hsl(var(--brand-fg))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "spin-slow": { "100%": { transform: "rotate(360deg)" } },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease both",
        "fade-up-1": "fade-up 0.4s ease 0.07s both",
        "fade-up-2": "fade-up 0.4s ease 0.14s both",
        "fade-up-3": "fade-up 0.4s ease 0.21s both",
        "fade-up-4": "fade-up 0.4s ease 0.28s both",
        "fade-in": "fade-in 0.3s ease both",
        shimmer: "shimmer 1.6s infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        float: "float 3s ease-in-out infinite",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(hsl(var(--border)/0.4) 1px, transparent 1px), linear-gradient(to right, hsl(var(--border)/0.4) 1px, transparent 1px)",
        "brand-glow":
          "radial-gradient(ellipse at 50% 0%, hsl(var(--brand)/0.15) 0%, transparent 65%)",
      },
      backgroundSize: {
        "grid-sm": "24px 24px",
        "grid-md": "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
