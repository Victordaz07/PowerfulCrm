import type { Config } from "tailwindcss";

// Paleta propia: "ink" (azul-tinta profundo, casi negro) para la base
// de la app + "amber" cálido como único acento de acción/estado.
// Evita deliberadamente el cliché cream+terracotta y el negro+neón.
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0E14",
          900: "#12161F",
          800: "#1B202C",
          700: "#262C3A",
          600: "#3A4152",
          500: "#5B6478",
          400: "#8B93A6",
          300: "#B7BECC",
          200: "#DDE1E8",
          100: "#F0F2F5",
          50: "#F8F9FB",
        },
        amber: {
          600: "#B4680A",
          500: "#D6820F",
          400: "#EFA23D",
          300: "#F5C377",
        },
        success: "#2F9E67",
        danger: "#D64545",
        warning: "#D6820F",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
      },
      transitionDuration: {
        instant: "80ms",
        fast: "120ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
