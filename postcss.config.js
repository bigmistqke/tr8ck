/* module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
} */


import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import tailwindConfig from './tailwind.config.js'

export default {
  plugins: [tailwind(tailwindConfig), autoprefixer],
}