import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import { app } from "./src/config/app.js";
import { config } from "./src/config/configuration.js";
import { routerGlobal } from "./src/router/routerGlobal.js";


// Configuración de variables para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Middleware para procesar datos enviados en el cuerpo de la solicitud
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de sesiones
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }, // secure: true en producción
  })
);

// Middleware global para pasar user a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || { role: "Usuario" };
  next();
});

// Rutas globales
app.use(routerGlobal);

// Rutas para gestión de PDFs (ruta actualizada)
import pdfRoutes from './src/modules/rooms/routes/pdfRoutes.js';
app.use('/api/pdfs', pdfRoutes);



// Importar e iniciar el servicio de cola de trabajos
import jobQueueService from './src/services/jobQueueService.js';
jobQueueService.startProcessing();

// Iniciar servidor
app.listen(app.get("port"), () => {
  console.log(`Servidor corriendo en: http://localhost:${app.get("port")}`);
});
