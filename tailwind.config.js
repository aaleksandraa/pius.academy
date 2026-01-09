/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf8f5',
          100: '#fbf0e8',
          200: '#f5ddd0',
          300: '#e9c4ad',
          400: '#dea988',
          500: '#c9906d',
          600: '#b07a58',
          700: '#926347',
          800: '#764f3a',
          900: '#5e3f2f',
        },
        dark: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #e9c4ad 0%, #dea988 50%, #c9906d 100%)',
      },
    },
  },
  plugins: [],
}
