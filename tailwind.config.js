/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/views/**/*.hbs", // Las vistas generales
  "./src/modules/**/views/**/*.hbs", // Todas las vistas dentro de módulos
  "./index.js"
];
export const theme = {
  extend: {},
};
export const plugins = [];
