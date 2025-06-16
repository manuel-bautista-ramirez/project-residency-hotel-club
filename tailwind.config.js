/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/views/**/*.hbs", // Procesar todas las vistas Handlebars
    "./index.js"              // Procesar el archivo principal si es necesario
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
