import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-jua)", "sans-serif"],
        sans: ['"Noto Sans KR"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: { DEFAULT: "#10B981", dark: "#059669", light: "#34D399" },
        gold: { DEFAULT: "#FBBF24", dark: "#F59E0B" },
      },
      keyframes: {
        // Draw cage: outer ring rotates while the balls inside jostle.
        "cage-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "cage-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-32%)" },
        },
        // Result reveal: each ball tumbles down into place (staggered via delay).
        "tumble-in": {
          "0%": { opacity: "0", transform: "translateY(-150%) rotate(-170deg) scale(0.5)" },
          "60%": { opacity: "1", transform: "translateY(12%) rotate(14deg) scale(1.06)" },
          "100%": { opacity: "1", transform: "translateY(0) rotate(0) scale(1)" },
        },
      },
      animation: {
        "cage-spin": "cage-spin 1.1s linear infinite",
        "cage-bounce": "cage-bounce 0.6s ease-in-out infinite",
        "tumble-in": "tumble-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
