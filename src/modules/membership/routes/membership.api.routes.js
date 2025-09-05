// ===============================
// RUTAS API DE MEMBRESÍAS (AJAX)
// ===============================
import express from "express";
import { authMiddleware } from "../../login/middlewares/accessDenied.js";
import { listMembershipController } from "../controllers/listMemberController.js";

const routerApi = express.Router();

// Middleware global
routerApi.use(authMiddleware);

// Helper para bind
const bind = (controller, method) => controller[method].bind(controller);

// API
routerApi.get("/api/memberships", bind(listMembershipController, "getMembresiasAPI"));
routerApi.get("/api/statistics", bind(listMembershipController, "getEstadisticasAPI"));

export { routerApi as membershipApiRoutes };
