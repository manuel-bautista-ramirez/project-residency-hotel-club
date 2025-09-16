import express from "express";
import routerLogin from "../modules/login/routers/routerLogin.js";
import { membershipApiRoutes, membershipRoutes, verificationRoutes } from "../modules/membership/routes/index.js";
import { routerRoom } from "../modules/rooms/routes/RouteRooms.js";

const routerGlobal = express.Router();

// Aquí se importaran  todos los routers de los módulos
routerGlobal.use(routerLogin);
routerGlobal.use("/memberships",membershipRoutes);
routerGlobal.use("/memberships", verificationRoutes);
routerGlobal.use("/api/memberships",membershipApiRoutes);
routerGlobal.use(routerRoom);
// Aquí importarlas las demas porfavor...

// Middleware para manejar error 404 (operando después de las rutas de las modulos)
routerGlobal.use((req, res) => {
  res.status(404).render("error404", {
    layout: "main",
    title: "Página no encontrada",
    messengger: "La ruta que estás intentando acceder no existe compilla.",
    url: req.originalUrl,
    showFooter: true,
  });
});

// Middleware para manejar error 500 (recibiendo 4 parámetros)
routerGlobal.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  res.status(500).render("error500", {
    layout: "main",
    title: "500",
    mensaje: "Error interno del servidor",
    errorMessage: isDev ? err.message : null,
    stack: isDev ? err.stack : null,
    showFooter: true,
  });
});

export { routerGlobal };
