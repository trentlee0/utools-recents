/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'utools-dark': '#303133'
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    base: false
  }
}
