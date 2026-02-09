/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Maslow brand colors
        maslow: {
          teal: "#6DC4AD",
          pink: "#EE7BB3",
          purple: "#401877",
          blue: "#469DBB",
          orange: "#F3A326",
          "purple-light": "#A070A6",
        },
        brand: {
          "teal-light": "#73C1AE",
          "teal-alt": "#60C3AE",
          "teal-tint": "#EBF7F4",
          "pink-muted": "#DA85B2",
          "purple-magenta": "#9D4B8E",
          "purple-alt": "#A56FA8",
          "orange-soft": "#EBA93D",
          yellow: "#FFF860",
          red: "#D52C2C",
          coral: "#E19379",
          green: "#2CD552",
        },
        neutral: {
          black: "#333333",
          gray: "#A5A5A5",
          silver: "#E6EAF3",
          "light-gray": "#EEEEEE",
        },
        dark: {
          blue: "#121D35",
          surface: "#1A2847",
          "surface-alt": "#243356",
          border: "#3A4A6B",
          text: "#B8C4D9",
        },
        state: {
          hover: "#EBF7F4",
          selected: "#EBF7F4",
          "selected-border": "#6DC4AD",
          focus: "#6DC4AD",
        },
        // Shadcn CSS variable system
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontSize: {
        sm: "0.80rem",
      },
      screens: {
        xs: "475px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      fontFamily: {
        sans: ["Manrope", ...defaultTheme.fontFamily.sans],
        display: ["Manrope", "system-ui", "sans-serif"],
        body: ["Graphik", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      typography: {
        DEFAULT: {
          css: {
            pre: {
              padding: "0",
              margin: "0",
              backgroundColor: "transparent",
            },
            code: {
              backgroundColor: "transparent",
              padding: "0",
              fontWeight: "400",
              color: "inherit",
            },
          },
        },
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};
