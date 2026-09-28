/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pokemon: {
          dark: '#0f172a',
          light: '#e2e8f0',
          accent: '#facc15',
        },
      },
    },
  },
  plugins: [],
}