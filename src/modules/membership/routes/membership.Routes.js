// ===============================
// RUTAS DE VISTAS DE MEMBRESÍAS
// ===============================
import express from "express";
import { authMiddleware } from "../../login/middlewares/accessDenied.js";
import {
  renderMembershipHome,
  renderMembershipCreate,
  renderEditMembership,
} from "../controllers/membershipController.js";
import { MembershipController } from "../controllers/createMemberController.js";
import { listMembershipController } from "../controllers/listMemberController.js";
import { editMemberController } from "../controllers/editMemberController.js";
import { deleteMemberController } from "../controllers/deleteMemberController.js";

const routerMembership = express.Router();

// Middleware global
routerMembership.use(authMiddleware);

// Helper para bind
const bind = (controller, method) => controller[method].bind(controller);

// Vistas
routerMembership.get("/", renderMembershipHome);
routerMembership.get("/createMembership", renderMembershipCreate);
routerMembership.get("/editMembership/:id", renderEditMembership);
routerMembership.get(
  "/createMembership/tipos",
  bind(MembershipController, "renderTiposMembresia")
);

// Acciones CRUD
routerMembership.get(
  "/listMembership",
  bind(listMembershipController, "renderMembershipList")
);
routerMembership.post(
  "/createClient",
  bind(MembershipController, "createClient")
);
routerMembership.post(
  "/createMembership",
  bind(MembershipController, "createMembership")
);
routerMembership.get('/editMembership/:id', editMemberController.editMembership);
routerMembership.post('/updateMembership/:id', editMemberController.updateMembership);
routerMembership.delete("/delete/:id", deleteMemberController.deleteMembership);


// Ruta con verificación de método existente
routerMembership.get("/tipos_membresia/:id", (req, res) => {
  if (MembershipController.getTipoMembresiaById) {
    return MembershipController.getTipoMembresiaById(req, res);
  }
  res.status(501).json({ error: "Not implemented" });
});

export { routerMembership as membershipRoutes };
