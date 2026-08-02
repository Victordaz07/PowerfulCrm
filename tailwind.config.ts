import type { Config } from "tailwindcss";

// Paleta propia: "ink" (azul-tinta profundo, casi negro) para la base
// de la app + "primary" (violeta) como único acento de acción/estado.
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0F1D",
          900: "#161D31",
          800: "#2D3748",
          700: "#374357",
          600: "#4A5568",
          500: "#64748B",
          400: "#A0AEC0",
          300: "#CBD5E1",
          200: "#E2E8F0",
          100: "#F1F5F9",
          50: "#F8FAFC",
        },
        primary: {
          600: "#6D28D9",
          500: "#7C3AED",
          400: "#9F75F0",
          300: "#C7ADF7",
        },
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
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
