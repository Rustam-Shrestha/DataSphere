/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./assets/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          soft: "var(--primary-soft)",
        },
        accent: {
          green: "var(--accent-green)",
        },
        secondary: "var(--secondary)",
        canvas: "var(--bg-canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          alt: "var(--surface-alt)",
          muted: "var(--surface-muted)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0, 0, 0, 0.06)",
        subtle: "0 1px 2px rgba(15, 23, 42, 0.05)",
      },
      borderRadius: {
        control: "6px",
        button: "8px",
        card: "12px",
      },
    },
  },
  plugins: [],
};
