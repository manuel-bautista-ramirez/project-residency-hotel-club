// Importación de dependencias
import express from 'express';
import exphbs from 'express-handlebars';
import Handlebars from 'handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import dotenv from 'dotenv';

import homeRoutes from './src/modules/login/routers/homeRoutes.js';

// Configuración de variables para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración de Handlebars
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: './src/views/layouts/',
  layoutsDir: "./src/modules/login/views/layouts/",
}));
app.set('view engine', 'hbs');
app.set('views', ['./src/views/', './src/modules/login/views/']);

// Registrar el helper "eq"
Handlebars.registerHelper('eq', (a, b) => a === b);

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para procesar datos enviados en el cuerpo de la solicitud
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de sesiones
app.use(session({
  secret: 'las_mujeres_me_dan_miedo',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

// Importar rutas
app.use(homeRoutes);

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto: http://localhost:${PORT}`);
});
