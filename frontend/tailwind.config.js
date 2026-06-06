/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        gestionoc: {
          "primary":          "#15803d",
          "primary-content":  "#ffffff",
          "secondary":        "#6b7280",
          "secondary-content":"#ffffff",
          "accent":           "#f97316",
          "accent-content":   "#ffffff",
          "neutral":          "#374151",
          "neutral-content":  "#f9fafb",
          "base-100":         "#f9fafb",
          "base-200":         "#f3f4f6",
          "base-300":         "#e5e7eb",
          "base-content":     "#111827",
          "info":             "#3b82f6",
          "success":          "#22c55e",
          "warning":          "#eab308",
          "error":            "#ef4444",
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
