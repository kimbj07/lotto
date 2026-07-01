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
    },
  },
  plugins: [],
};
export default config;
