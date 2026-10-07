/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shibuya: {
          accent: '#8C4580',
          cardMain: '#032326',
          title: '#06402F',
          cardSec: '#125938',
          cardTer: '#308C50',
          bg: '#F7F7E6',
        }
      },
      fontFamily: {
        serif: ['PT Serif Caption', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
