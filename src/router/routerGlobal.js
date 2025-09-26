import express from "express";
import routerLogin from "../modules/login/routers/routerLogin.js";
import { membershipApiRoutes, membershipRoutes } from "../modules/membership/routes/index.js";
import { routerRoom } from "../modules/rooms/routes/RouteRooms.js";

const routerGlobal = express.Router();

// Rutas de módulos
routerGlobal.use(routerLogin);
routerGlobal.use("/memberships", membershipRoutes);
routerGlobal.use("/api/memberships", membershipApiRoutes);
routerGlobal.use(routerRoom);


// Middleware para manejar error 404 (después de todas las rutas)
routerGlobal.use((req, res) => {
  res.status(404).render("error404", {
    layout: "main",
    title: "Página no encontrada",
    messengger: "La ruta que estás intentando acceder no existe.",
    url: req.originalUrl,
    showFooter: true,
  });
});

// Middleware para manejar error 500
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
