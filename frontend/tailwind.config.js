/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'mafia-bg': '#050505',
        'mafia-panel': '#111111',
        'mafia-card': '#1a1a1a',
        'mafia-red': '#b91c1c',
        'mafia-red-soft': '#7f1d1d',
      },
    },
  },
  plugins: [],
}

