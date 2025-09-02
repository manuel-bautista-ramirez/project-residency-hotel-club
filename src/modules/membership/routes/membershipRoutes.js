import express from "express";
import {
  renderMembershipHome,
  renderMembershipList,
  renderMembershipCreate
} from "../controllers/membershipController.js";
import {
  authMiddleware,
} from "../../login/middlewares/accessDenied.js";
import { MembershipController } from "../controllers/createMemberController.js";
import { listMembershipController } from "../controllers/listMemberController.js";

const routerMember = express.Router();

// Primero autenticación (todos deben estar logueados)
routerMember.use(authMiddleware);


// Rutas accesibles a TODOS los roles autenticados
routerMember.get('/', renderMembershipHome);
routerMember.get("/createMembership", renderMembershipCreate);



routerMember.get('/createMembership', MembershipController.renderTiposMembresia);
routerMember.get("/listMembership", listMembershipController.renderMembershipList.bind(listMembershipController));
routerMember.post("/createClient", MembershipController.createClient.bind(MembershipController));
routerMember.post("/createMembership", MembershipController.createMembership.bind(MembershipController));
routerMember.get("/tipos_membresia/:id", (req, res) => {
  if (MembershipController.getTipoMembresiaById) {
    return MembershipController.getTipoMembresiaById(req, res);
  }
  res.status(501).json({ error: "Not implemented" });
});






// Rutas API para AJAX
routerMember.get("/api/memberships", listMembershipController.getMembresiasAPI.bind(listMembershipController));
routerMember.get("/api/statistics", listMembershipController.getEstadisticasAPI.bind(listMembershipController));

export { routerMember };
