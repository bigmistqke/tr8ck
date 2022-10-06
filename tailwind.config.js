/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    
    extend: {
      colors: {"selected": "var(--selected-color) !important"},
    },
  },
  plugins: [],
}
