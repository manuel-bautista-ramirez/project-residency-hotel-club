import express from 'express';
import { renderMembershipCreate, renderMembershipHome, renderMembershipList} from '../controllers/membershipController.js';
import { authMiddleware, roleMiddleware } from '../../login/middlewares/accessDenied.js';
import { MembershipController } from '../controllers/createMemberController.js';

const routerMember = express.Router();

// Primero autenticación (todos deben estar logueados)
// Primero autenticación (todos deben estar logueados)
routerMember.use(authMiddleware);

// Rutas accesibles a TODOS los roles autenticados
// Rutas accesibles a TODOS los roles autenticados
routerMember.get('/', renderMembershipHome);
routerMember.get('/createMembership', MembershipController.renderTiposMembresia);
routerMember.get('/listMembership', renderMembershipList);



routerMember.get("/tipos_membresia/:id", MembershipController.getTipoMembresiaById);




//post
routerMember.post("/createClient", MembershipController.createClient);
routerMember.post("/createMembership", MembershipController.createMembership);

export { routerMember };
