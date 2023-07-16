/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryViolet: "#6539C3",
        primaryGray: "#575F6A",
        mainGray: "#626262",
        wwmBlue: "#080D2D",
        wwwGrey: "#62626A",
        errorBG: '#FBEAE6',
        error: '#DE7965',
        wwwGrey2: '#6B7B8A',
      }
    },
    fontFamily: {
      temporary: ['"Roboto"', 'sans-serif'],
      manrope: ['Manrope', 'sans-serif']
    }
  },
  plugins: [],
}

