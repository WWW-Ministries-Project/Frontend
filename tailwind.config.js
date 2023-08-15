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
        error: '#E97760',
        wwwGrey2: '#6B7B8A',
        dark900: '#14092C',
        gray: "#786D8F",
        bgWhite: "#F9F9F9",
        lightGray:"#C7C2D3",
      }
    },
    fontFamily: {
      fontRoboto: ['"Roboto"', 'sans-serif'],
      manrope: ['Manrope', 'sans-serif']
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const utilities = {
        '.text-sma': {
          'font-size': '13.33px',
          'line-height': '16px',
        },
      };
      addUtilities(utilities);
    },
  ],
}

