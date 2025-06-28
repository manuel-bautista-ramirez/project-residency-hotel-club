/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/views/**/*.hbs",                  // Las vistas generales
    "./src/modules/**/views/**/*.hbs",       // ✅ TODAS las vistas dentro de módulos
    "./index.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
