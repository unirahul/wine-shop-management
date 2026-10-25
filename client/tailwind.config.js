/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fdf3f4',
          100: '#fbe8ea',
          200: '#f7d3d7',
          300: '#f0adb5',
          400: '#e57b88',
          500: '#d74e60',
          600: '#c03348',
          700: '#9b2437',
          800: '#721c2b',
          900: '#4c131d',
          950: '#2d0910',
        },
        champagne: {
          50: '#fcfbf7',
          100: '#f7f4ea',
          200: '#efe6cd',
          300: '#e4d3a8',
          400: '#d4bc7e',
          500: '#c5a55d',
          600: '#b08b47',
          700: '#906d37',
          800: '#76562f',
          900: '#63472b',
          950: '#382515',
        },
      },
    },
  },
  plugins: [],
}
