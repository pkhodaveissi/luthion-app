import type { Config } from "tailwindcss";


export const colorObj = {
  colors: {
    background: "#0E0E0E", // Default dark mode background
    foreground: "#F5F5F5", // Default text color

    text: {
      muted: "#B3B3B3", // Lighter gray text
      primary: "#FFFFFF", // Pure white text
      secondary: "#F5F5F5", // Slightly off-white text
    },
    surface: "#1C1C1C", // Buttons & card items background
    border: "#B3B3B3", // Borders
    chart: {
      filled: "#D9D9D9", // Chart bar fill (completed part)
    },
  },
  boxShadow: {
    'border': '0 0px 2px rgba(221, 221, 221, 0.40)',
  },
}
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: colorObj.colors,
      boxShadow: colorObj.boxShadow
    },
  },
  plugins: [],
} satisfies Config;
