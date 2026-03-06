const colorVar = cssVarName => `rgb(var(${cssVarName}) / <alpha-value>)`;

const brandColors = {
  primary: colorVar("--color-primary"),
  secondary: colorVar("--color-secondary"),
  background: colorVar("--color-background"),

  primaryGray: colorVar("--color-primaryGray"),
  mainGray: colorVar("--color-mainGray"),
  lightGray: colorVar("--color-lightGray"),
  borderGray: colorVar("--color-borderGray"),
  inputBackground: colorVar("--color-inputBackground"),

  success: colorVar("--color-success"),
  error: colorVar("--color-error"),
  warning: colorVar("--color-warning"),

  shadow: colorVar("--color-shadow"),
  blur: colorVar("--color-blur"),
  modalOverlay: colorVar("--color-modalOverlay"),
  hoverGold: colorVar("--color-hoverGold"),

  lighter: colorVar("--color-lighter"),
  lightest: colorVar("--color-lightest"),
  accent: colorVar("--color-accent"),
  pale: colorVar("--color-pale"),
};

const legacyColors = {
  wwmBlue: colorVar("--color-wwmBlue"),
  wwwGray: colorVar("--color-wwwGray"),
  wwwGrey2: colorVar("--color-wwwGrey2"),
  errorBG: colorVar("--color-errorBG"),
  bgWhite: colorVar("--color-bgWhite"),
  gold: colorVar("--color-gold"),
  lighterBlack: colorVar("--color-lighterBlack"),
  neutralGray: colorVar("--color-neutralGray"),
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Work Sans", "sans-serif"],
      fontRoboto: ["Work Sans", "sans-serif"],
      manrope: ["Work Sans", "sans-serif"],
      "great-vibes": ["Great Vibes", "cursive"],
    },
    screens: {
      xs: "320px",
      phone: "450px",
      sm: "450px", // Legacy alias retained for existing layouts
      tablet: "640px",
      md: "768px",
      laptop: "1024px",
      lg: "1024px", // Legacy alias retained for existing layouts
      desktop: "1280px",
      xl: "1280px", // Legacy alias retained for existing layouts
      "2xl": "1536px",
      "3xl": "1800px",
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
      },
    },
    extend: {
      colors: {
        ...brandColors,
        ...legacyColors,
        white: colorVar("--color-white"),
        black: colorVar("--color-black"),
        gray: {
          50: colorVar("--color-gray-50"),
          100: colorVar("--color-gray-100"),
          200: colorVar("--color-gray-200"),
          300: colorVar("--color-gray-300"),
          400: colorVar("--color-gray-400"),
          500: colorVar("--color-gray-500"),
          600: colorVar("--color-gray-600"),
          700: colorVar("--color-gray-700"),
          800: colorVar("--color-gray-800"),
          900: colorVar("--color-gray-900"),
          DEFAULT: colorVar("--color-gray-600"),
        },
      },
      animation: {
        dounce: "bounce 2s",
        wiggle: "wiggle 1s",
        fadeIn: "fadeIn 1s",
        fadeOut: "fadeOut 1s",
        "pulse-ring":
          "pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "divine-glow": "divine-glow 3s ease-in-out infinite",
        "flame-flicker": "flame-flicker 2s ease-in-out infinite",
        "logo-breathe": "logo-breathe 3s ease-in-out infinite",
        "flame-dance": "flame-dance 8s linear infinite",
        float: "float 4s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "flame-dance": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "0.8" },
          "25%": { transform: "scale(1.1) rotate(2deg)", opacity: "1" },
          "50%": { transform: "scale(0.95) rotate(-1deg)", opacity: "0.9" },
          "75%": { transform: "scale(1.05) rotate(1deg)", opacity: "1" },
        },
        "divine-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgb(245 158 11 / 0.4)" },
          "50%": { boxShadow: "0 0 40px rgb(245 158 11 / 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "flame-flicker": {
          "0%, 100%": { opacity: "0.7", transform: "scaleY(1)" },
          "50%": { opacity: "1", transform: "scaleY(1.1)" },
        },
        "logo-breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        wiggle: {
          "0%, 100%": {
            transform: "matrix(1, 0, 0, 1, 0, 0)",
          },
          "50%": { transform: "rotate(3deg)" },
        },
        bounce: {
          "0%": {
            transform: "translateY(-100%)",
            animationTimingFunction: "linear",
          },
          "50%": {
            transform: "translateY(25%)",
            animationTimingFunction: "linear",
          },
          "100%": {
            transform: "translateY(0%)",
            animationTimingFunction: "linear",
          },
        },
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateX(100%)",
          },
          "50%": {
            opacity: "0.5",
          },
          "100%": {
            opacity: "1",
          },
        },
        fadeOut: {
          "0%": {
            opacity: "1",
            transform: "translateX(-100%)",
          },
          "50%": {
            opacity: "0.5",
          },
          "100%": {
            opacity: "0",
          },
        },
      },
      transitionDuration: {
        2000: "2000ms",
        5000: "5000ms",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".text-sma": {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
        },
        ".text-xxs": {
          fontSize: "0.75rem",
          lineHeight: "1rem",
        },
        ".H600": {
          fontFamily: "Work Sans, sans-serif",
          fontSize: "1.2rem",
          fontStyle: "normal",
          fontWeight: "700",
          lineHeight: "1.5rem",
        },
        ".H700": {
          fontFamily: "Work Sans, sans-serif",
          fontSize: "1.44rem",
          fontStyle: "normal",
          fontWeight: "700",
          lineHeight: "1.75rem",
        },
        ".H400": {
          fontFamily: "Work Sans, sans-serif",
          fontSize: "1.125rem",
          fontStyle: "normal",
          fontWeight: "600",
          lineHeight: "1.75rem",
        },
        ".P100": {
          fontFamily: "Work Sans, sans-serif",
          fontSize: "0.875rem",
          fontStyle: "normal",
          fontWeight: "400",
          lineHeight: "1.25rem",
        },
        ".P200": {
          fontFamily: "Work Sans, sans-serif",
          fontSize: "1rem",
          fontStyle: "normal",
          fontWeight: "400",
          lineHeight: "1.5rem",
        },
        ".P250": {
          fontFamily: "Work Sans, sans-serif",
          fontSize: "1rem",
          fontStyle: "normal",
          fontWeight: "600",
          lineHeight: "1.5rem",
        },
        ".P900": {
          fontFamily: "Work Sans, sans-serif",
          fontSize: "2.5rem",
          fontStyle: "normal",
          fontWeight: "400",
          letterSpacing: "-0.8px",
        },
        ".gradientBtn": {
          "@apply bg-gradient-to-r from-primary to-accent text-white transition duration-300 hover:from-primary hover:to-lightest hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40":
            {},
        },
        ".header": {
          height: "clamp(40px, 6vh, 60px)",
        },
      });
    },
  ],
};
