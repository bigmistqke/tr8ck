/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontSize: {
      xs: ["0.6rem", "0.75rem"],
    },
    extend: {
      spacing: {
        128: "32rem",
      },
      colors: {
        "selected-instrument": "var(--selected-instrument)",
        "selected-pattern": "var(--selected-pattern) !important",
      },
      animation: {
        record: "record 1s ease-in-out infinite",
      },
      keyframes: {
        record: {
          "0%, 100%": {
            // filter: 'brightness(5) drop-shadow(0px 0px 25px red)',
            color: "red",
            transform: "scale(100%)",
          },
          "50%": {
            // filter: 'brightness(1) drop-shadow(0px 0px 0px red)',
            color: "red",
            transform: "scale(50%)",
          },
        },
      },
    },
  },
  plugins: [],
};
