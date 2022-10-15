/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    
    extend: {
      colors: {"selected": "var(--selected-color) !important"},
    },
  },
  plugins: [],
}
