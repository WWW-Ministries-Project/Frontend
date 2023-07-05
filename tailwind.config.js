/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        primaryViolet: "#6539C3",
        mainGray:"#626262",
        wwmBlue: "#080D2D",
        wwwGrey: "#62626A",
        errorBG: '#FBEAE6',
        error: '#DE7965',
      }
    },
  },
  plugins: [],
}

