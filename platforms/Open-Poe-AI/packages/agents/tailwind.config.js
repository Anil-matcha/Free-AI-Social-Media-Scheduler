/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'primary': '#3898ec',
        'primary-bg': '#121212',
        'secondary-bg': '#1E1E1E',
        'primary-text': '#E0E0E0',
        'secondary-text': '#B0B0B0',
        'divider': '#333333',
      },
    },
  },
  plugins: [],
}

