/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1a2332',
          navy: '#1a2332',
        },
        primary: {
          DEFAULT: '#3b82f6',
          light: 'rgba(59, 130, 246, 0.15)',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: {
          DEFAULT: '#f5f7fa',
          light: '#f5f7fa',
        },
        area: {
          otin: '#f97316',
          dec: '#3b82f6',
          ota: '#10b981',
          otpp: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
