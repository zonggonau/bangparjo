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
        primary: {
          DEFAULT: "#FF6B35",
          dark: "#E55A28",
          light: "#FF8C5A",
          alpha: "rgba(255, 107, 53, 0.1)",
        },
        secondary: {
          DEFAULT: "#1A1A2E",
          light: "#16213E",
        },
        accent: {
          DEFAULT: "#0F3460",
          light: "#E94560",
        },
        background: {
          dark: "#07070e",
          light: "#FFFFFF",
        },
        text: {
          primary: "#111827",
          secondary: "#4B5563",
          muted: "#9CA3AF",
          inverse: "#FFFFFF",
          price: "#E94560",
          dark: "#f0f0f6",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.07)",
        "card-hover": "0 8px 30px rgba(255,107,53,0.16)",
      }
    },
  },
  plugins: [],
};
export default config;
