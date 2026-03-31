/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        surface: '#0a0a0f',
        card: 'rgba(12,12,24,0.9)',
        border: '#252538',
      },
    },
  },
  plugins: [],
};
