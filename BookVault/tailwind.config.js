/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#3a506b',
          light: '#4d6a8f',
          dark: '#2d3e53',
        },
        secondary: {
          DEFAULT: '#1c2541',
          light: '#2c3c68',
          dark: '#0f1529',
        },
        accent: {
          DEFAULT: '#ff8364',
          light: '#ffa894',
          dark: '#e66947',
        },
        light: '#f5f5f5',
        dark: '#0b132b',
      },
    },
  },
  plugins: [],
};