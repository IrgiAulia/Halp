import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          low: {
            DEFAULT: "#10b981", // emerald-500
            bg: "#064e3b",      // emerald-900
            border: "#065f46", // emerald-800
            text: "#6ee7b7",   // emerald-300
          },
          medium: {
            DEFAULT: "#f59e0b", // amber-500
            bg: "#451a03",      // amber-950
            border: "#78350f", // amber-900
            text: "#fcd34d",   // amber-300
          },
          high: {
            DEFAULT: "#f97316", // orange-500
            bg: "#431407",      // orange-950
            border: "#7c2d12", // orange-900
            text: "#fdba74",   // orange-300
          },
          critical: {
            DEFAULT: "#ef4444", // red-500
            bg: "#450a0a",      // red-950
            border: "#7f1d1d", // red-900
            text: "#fca5a5",   // red-300
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
