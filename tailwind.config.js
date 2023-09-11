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
        lightGray: "#C7C2D3",
        blur: "#222222cc",
        green: "#6FCF97",
        lighterBlack: "#575570",
        neutralGray: "#E8EDFF",  
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
        '.H600': {
          'font-family': 'Rubik',
          'font-size': '19.2px',
          'font-style': 'normal',
          'font-weight': '700',
          'line-height': '24px',
        },
        '.H700': {
          'font-family': 'Rubik',
          'font-size': '23.04px',
          'font-style': 'normal',
          'font-weight': '700',
          'line-height': '28px',
        },
        '.P100': {
          'font-family': 'Rubik',
          'font-size': '13.33x',
          'font-style': 'normal',
          'font-weight': '400',
          'line-height': '16px', /* 150% */
        },
        '.P200': {
          'font-family': 'Rubik',
          'font-size': '16px',
          'font-style': 'normal',
          'font-weight': '400',
          'line-height': '24px', /* 150% */
        },
        '.P250': {
          'font-family': 'Rubik',
          'font-size': '16px',
          'font-style': 'normal',
          'font-weight': '600',
          'line-height': '24px', /* 150% */
        },
        '.P900': {
          'font-family': 'Rubik',
          'font-size': '40px',
          'font-style': 'normal',
          'font-weight': '400',
          'letter-spacing': '-0.8px',
        }
      };
      addUtilities(utilities);
    },
  ],
}

