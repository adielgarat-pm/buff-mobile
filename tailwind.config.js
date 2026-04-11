/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/tailwind/native')],
  theme: {
    extend: {
      colors: {
        // Child view (Gamer Mode) — dark neon palette
        'gamer-bg': '#0F0F1A',
        'gamer-accent': '#7C3AED',
        'gamer-neon': '#A78BFA',
        // Parent view (Zen Mode) — light calm palette
        'zen-bg': '#FAFAFA',
        'zen-accent': '#6D28D9',
        'zen-muted': '#8B5CF6',
      },
    },
  },
  plugins: [],
};
