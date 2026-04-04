/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',    // slate-900
        surface: '#1e293b',       // slate-800
        primary: '#3b82f6',       // blue-500
        primaryHover: '#2563eb',  // blue-600
        accent: '#8b5cf6',        // violet-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
