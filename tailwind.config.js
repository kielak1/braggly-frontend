/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",          // Wszystkie strony w `app/`
    "./src/components/**/*.{js,ts,jsx,tsx}",   // Komponenty globalne
    "./src/lib/**/*.{js,ts,jsx,tsx}",          // Pliki pomocnicze (np. `i18n.ts` jeśli ma JSX)
    "./src/styles/**/*.css",                   // Styl globalny Tailwind
    "./src/utils/**/*.{js,ts,jsx,tsx}"         // Pliki utils, jeśli używasz Tailwind w JSX
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
