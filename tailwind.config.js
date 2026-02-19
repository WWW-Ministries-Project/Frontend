const brandColors = {
  primary: "#080D2D",
  secondary: "#9A5D1A",
  background: "#FFFFFF",

  primaryGray: "#4B5563",
  mainGray: "#6B7280",
  lightGray: "#D8DAE5",
  borderGray: "#E0E3EB",
  inputBackground: "#F8F9FC",

  success: "#166534",
  error: "#B91C1C",
  warning: "#B45309",

  shadow: "#00000026",
  blur: "#222222CC",
  modalOverlay: "#080D2D99",
  hoverGold: "#A2621C",

  lighter: "#1A2255",
  lightest: "#2C3877",
  accent: "#3D4B99",
  pale: "#4E5FBB",
};

const legacyColors = {
  wwmBlue: "#080D2D",
  wwwGray: "#62626A",
  wwwGrey2: "#6B7B8A",
  errorBG: "#FBEAE6",
  bgWhite: "#F9F9F9",
  gold: "#EFBF04",
  lighterBlack: "#575570",
  neutralGray: "#E8EDFF",
};

/** @type {import('tailwindcss').Config} */
export default {
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
        gray: {
          DEFAULT: "#575F6A",
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
