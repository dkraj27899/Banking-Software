/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  important: '#root',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#E8EAF0',
          100: '#C5C9D6',
          200: '#9DA4BA',
          300: '#757F9E',
          400: '#576389',
          500: '#394774',
          600: '#33406C',
          700: '#2B3761',
          800: '#242D57',
          900: '#0A1628',
          950: '#060E1A',
        },
        gold: {
          50: '#FBF7F0',
          100: '#F5EBD6',
          200: '#EDDBBA',
          300: '#E4CB9E',
          400: '#DDBF89',
          500: '#C5A572',
          600: '#B8935F',
          700: '#A67D4A',
          800: '#8A6738',
          900: '#6E5129',
        },
      },
    },
  },
  plugins: [],
};
