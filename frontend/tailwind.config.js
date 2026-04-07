/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'osu-dark': '#0a0a0a',
        'osu-darker': '#050505',
        'osu-purple': '#b84ed6',
        'osu-pink': '#ff6b9d',
        'osu-cyan': '#00d4ff',
      },
    },
  },
  plugins: [],
};
