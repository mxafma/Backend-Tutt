/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green:       '#2a7a2e',
          'green-light':'#4db520',
          orange:      '#f5921d',
          lime:        '#eaf5c2',
          'lime-dark': '#d4e89a',
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        gestionoc: {
          "primary":           "#2a7a2e",
          "primary-content":   "#ffffff",
          "secondary":         "#4db520",
          "secondary-content": "#ffffff",
          "accent":            "#f5921d",
          "accent-content":    "#ffffff",
          "neutral":           "#374151",
          "neutral-content":   "#f9fafb",
          "base-100":          "#ffffff",
          "base-200":          "#f4fbe8",
          "base-300":          "#e4f2cc",
          "base-content":      "#1a2e1a",
          "info":              "#3b82f6",
          "success":           "#22c55e",
          "warning":           "#eab308",
          "error":             "#ef4444",
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}
