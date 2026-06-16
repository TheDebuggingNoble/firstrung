import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1020",
        rung: {
          50: "#eef6ff",
          100: "#d9ebff",
          400: "#5aa2ff",
          500: "#2f7df6",
          600: "#1f5fd0",
          700: "#1a4ba3",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
