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
        construct: {
          bg: "#F7F7F4",
          surface: "#FFFFFF",
          text: "#202321",
          secondary: "#686D68",
          muted: "#EFEEE9",
          border: "#E2E1DA",
          orange: "#F36B32",
          orangeHover: "#D95724",
          success: "#287A54",
          warning: "#B87518",
          danger: "#C44235",
          info: "#426B92",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(32, 35, 33, 0.05), 0 1px 2px 0 rgba(32, 35, 33, 0.03)",
        card: "0 2px 6px -1px rgba(32, 35, 33, 0.06), 0 2px 4px -2px rgba(32, 35, 33, 0.04)",
        elevated: "0 10px 25px -3px rgba(32, 35, 33, 0.08), 0 4px 6px -4px rgba(32, 35, 33, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
