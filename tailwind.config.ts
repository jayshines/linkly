import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        line: token("line"),
        fg: token("fg"),
        muted: token("muted"),
        faint: token("faint"),
        accent: token("accent"),
        "accent-fg": token("accent-fg"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 6px 20px -10px rgb(0 0 0 / 0.1)",
        pop: "0 24px 60px -20px rgb(0 0 0 / 0.35)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: { to: { transform: "translateX(100%)" } },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
