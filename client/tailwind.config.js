/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9f6',
          100: '#dbf0e8',
          500: '#0f8f5f',
          600: '#0c7350',
          700: '#0a5c41',
        },
      },
    },
  },
  plugins: [],
};
