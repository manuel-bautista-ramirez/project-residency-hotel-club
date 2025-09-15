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

// ===============================
// RUTAS RELATIVAS
// ===============================

// Lista de membresías
// URL final: GET /api/memberships/
routerApi.get("/", bind(listMembershipController, "getMembresiasAPI"));

// Estadísticas
// URL final: GET /api/memberships/statistics
routerApi.get("/statistics", bind(listMembershipController, "getEstadisticasAPI"));

// Integrantes de una membresía activa
// URL final: GET /api/memberships/:id_activa/integrantes
routerApi.get("/:id_activa/integrantes", (req, res) =>
  listMembershipController.getIntegrantesAPI(req, res)
);

// Detalles de una membresía
// URL final: GET /api/memberships/details/:id
routerApi.get("/details/:id", (req, res) =>
  listMembershipController.getMembershipDetailsAPI(req, res)
);

export { routerApi as membershipApiRoutes };
