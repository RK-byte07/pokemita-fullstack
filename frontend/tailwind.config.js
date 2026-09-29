/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#090F1F',
        card: '#151F35',
        surface: '#202C45',
        brand: { DEFAULT: '#F6C90E', light: '#FFE16A' },
        info: '#33A1FD',
        special: '#8B5CF6',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
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