import express from "express";
import routerLogin from "../modules/login/routers/routerLogin.js";
import { membershipApiRoutes, membershipRoutes } from "../modules/membership/routes/index.js";
import { routerRoom } from "../modules/rooms/routes/RouteRooms.js";
import { entriesRouter } from "../modules/entries/router/RouteDailyEntries.js";
import { routerStore } from "../modules/store/routes/storeRoutes.js";
import { adminRouter } from "../modules/admin/router/adminRouter.js";

// Rutas de módulos

// Importar el servicio centralizado de WhatsApp
import whatsappService from '../services/whatsappService.js';

// Importar y habilitar el servicio de correo electrónico
import emailService from '../services/emailService.js';

// Importar middlewares de validación de sesión
import { verifySessionConsistency } from '../middlewares/validation/userActiveCheck.js';

const routerGlobal = express.Router();

// Ruta raíz con verificación de WhatsApp
routerGlobal.get('/', (req, res) => {
  const status = whatsappService.getStatus();
  if (status.connected) {
    // Si WhatsApp está conectado, ir al login
    res.redirect('/login');
  } else {
    // Si no, mostrar la página para escanear el QR
    res.render('whatsapp-qr', {
      layout: 'main',
      title: 'Vincular WhatsApp',
      centerContent: true // Centrar el contenido en la página
    });
  }
});



// Middleware para verificar estado del usuario en cada petición
routerGlobal.use(verifySessionConsistency);

// Rutas de módulos
routerGlobal.use(routerLogin);
routerGlobal.use(routerRoom);
routerGlobal.use("/memberships", membershipRoutes);
routerGlobal.use("/api/memberships", membershipApiRoutes);
routerGlobal.use(entriesRouter);
routerGlobal.use(routerStore);
routerGlobal.use(adminRouter);




// Ruta para mostrar la página del QR
routerGlobal.get('/whatsapp-qr', (req, res) => {
  const status = whatsappService.getStatus();
  if (status.connected) {
    return res.redirect('/login');
  }
  res.render('whatsapp-qr', {
    layout: 'main',
    title: 'Vincular WhatsApp',
    centerContent: true
  });
});

// API para obtener estado de WhatsApp en JSON
routerGlobal.get('/api/whatsapp/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado de WhatsApp' });
  }
});

// API para verificar integridad de sesión (llamada por el frontend proactivamente)
routerGlobal.get('/api/session/check', (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.status(401).json({ success: false, message: 'No session' });
  }
});


// Middleware para manejar error 404 (después de todas las rutas)
routerGlobal.use((req, res) => {
  res.status(404).render("error404", {
    layout: "main",
    title: "Página no encontrada",
    messengger: "La ruta que estás intentando acceder no existe.",
    url: req.originalUrl,
    showFooter: true,
    disablePageLoadingOverlay: true,
  });
});

// Middleware para manejar error 500
routerGlobal.use((err, req, res, next) => {
  console.error("❌❌❌ ERROR 500 CAPTURADO ❌❌❌");
  console.error("Mensaje:", err.message);
  console.error("Stack:", err.stack);

  const isDev = process.env.NODE_ENV === "development";

  res.status(500).render("error500", {
    layout: "main",
    title: "500",
    mensaje: "Error interno del servidor",
    errorMessage: err.message, // Siempre mostrar el mensaje
    stack: err.stack, // Siempre mostrar el stack
    showFooter: true,
    disablePageLoadingOverlay: true,
  });
});

export { routerGlobal };
