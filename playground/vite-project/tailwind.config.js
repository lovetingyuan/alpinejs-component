/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './**/*.htm'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  corePlugins: {
    // preflight: false,
  },
}
