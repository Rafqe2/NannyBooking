/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "pastel-blue": "#E6F3FF",
        "pastel-pink": "#FFE6F0",
        "pastel-mint": "#E6FFF0",
        "background-cream": "#E9E5DD",
        // Accent — 3% sunny yellow (star ratings, badges, highlights)
        accent: {
          light: "#FFF3B0",
          DEFAULT: "#FFD700",
          dark:  "#E6B800",
        },
        // Brand palette — 60% G485, 30% #0F3D2E deep forest, 10% Black
        brand: {
          50:  "#edf4f1",  // near-white deep green tint
          100: "#e9e5dd",  // Tikkurila G485 (background base)
          200: "#9dc4b5",  // light deep green
          300: "#6da58f",  // medium-light
          400: "#44876e",  // medium
          500: "#276b52",  // medium-dark
          600: "#0F3D2E",  // Deep Forest (primary)
          700: "#0b2e22",  // dark
          800: "#071e16",  // darker
          900: "#030f0b",  // near-black
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        "3xl": "0 35px 60px -12px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
