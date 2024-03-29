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
      },
      animation: {
        dounce: 'bounce 2s',
        wiggle: 'wiggle 1s',
        fadeIn: 'fadeIn 1s',
        fadeOut: 'fadeOut 1s'

      },
      keyframes: {
        wiggle: {
          '0%, 100%': {
            // transform: 'rotate(-3deg)',
            transform: "matrix(1, 0, 0, 1, 0, 0)"
          },
          '50%': { transform: 'rotate(3deg)' },
        },
        bounce: {
          '0%': {
            transform: 'translateY(-100%)',
            animationTimingFunction: 'linear',
          },
          '50%': {
            transform: 'translateY(25%)',
            animationTimingFunction: 'linear',
          },
          '100%': {
            transform: 'translateY(0%)',
            animationTimingFunction: 'linear',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
            transform: 'translateX(100%)',
          },
          '50%': {
            opacity: '0.5',
          },
          '100%': {
            opacity: '1',
          },
        },
        fadeOut: {
          '0%': {
            opacity: '1',
            transform: 'translateX(-100%)',
          },
          '50%': {
            opacity: '0.5',
          },
          '100%': {
            opacity: '0',
          },
        }

      },
      transitionDuration: {
        '2000': '2000ms',
        '5000': '5000ms',
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

