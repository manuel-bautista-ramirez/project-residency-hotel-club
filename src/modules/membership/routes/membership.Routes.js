// ===============================
// RUTAS DE VISTAS DE MEMBRESÍAS
// ===============================
import express from "express";
import { authMiddleware } from "../../login/middlewares/accessDenied.js";
import {
  renderMembershipHome,
  renderMembershipCreate,
  renderEditMembership,
  renderRenewMembership,
} from "../controllers/membershipController.js";
import { reportsController } from "../controllers/reportsController.js";
import { MembershipController } from "../controllers/createMemberController.js";
import { listMembershipController } from "../controllers/listMemberController.js";
import { editMemberController } from "../controllers/editMemberController.js";
import { deleteMemberController } from "../controllers/deleteMemberController.js";

const routerMembership = express.Router();

// Middleware global
routerMembership.use(authMiddleware);

// Helper para bind
const bind = (controller, method) => controller[method].bind(controller);

// Ruta para servir la imagen QR
routerMembership.get(
  "/api/qr/:id_activa",
  bind(MembershipController, "serveQRCode")
);

// Ruta para descargar el QR
routerMembership.get('/download-qr/:id_activa', MembershipController.downloadQR);

// Vistas
routerMembership.get("/", renderMembershipHome);
routerMembership.get("/createMembership", renderMembershipCreate);
routerMembership.get("/editMembership/:id", renderEditMembership);
routerMembership.get("/renew/:id", renderRenewMembership);
routerMembership.get(
  "/createMembership/tipos",
  bind(MembershipController, "renderTiposMembresia")
);
routerMembership.get("/reports", bind(reportsController, "renderReports"));

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
routerMembership.post("/renew/:id", editMemberController.renewMembership);
routerMembership.delete("/delete/:id", deleteMemberController.deleteMembership);


// Ruta con verificación de método existente
routerMembership.get("/tipos_membresia/:id", (req, res) => {
  if (MembershipController.getTipoMembresiaById) {
    return MembershipController.getTipoMembresiaById(req, res);
  }
  res.status(501).json({ error: "Not implemented" });
});

export { routerMembership as membershipRoutes };
