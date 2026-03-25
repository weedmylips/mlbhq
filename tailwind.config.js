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
        surface: 'var(--team-page-bg)',
        card: 'var(--team-card-bg)',
        border: 'var(--team-card-border)',
      },
    },
  },
  plugins: [],
};
