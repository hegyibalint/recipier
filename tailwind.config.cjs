const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    boxShadow: {
      sm: '0.25rem 0.25rem rgba(107, 114, 128)',
      md: '0.5rem 0.5rem rgba(107, 114, 128)',
      DEFAULT: '1rem 1rem #5a5c69'
    },
    extend: {
      colors: {
        primary: colors.slate[700],
        secondary: colors.emerald[600]
      }
    }
  },
  plugins: []
};
