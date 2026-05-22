/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "#111118",
        card: "#16161f",
        border: "#1e1e2d",
        "border-light": "#2a2a3d",
        muted: "#4a4a6a",
        text: "#e2e2f0",
        "text-muted": "#7070a0",
        mbm: "#3b82f6",
        "mbm-dim": "#1e40af",
        tradex: "#f59e0b",
        "tradex-dim": "#92400e",
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Syne", "DM Sans", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
