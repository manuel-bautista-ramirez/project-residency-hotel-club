import express from 'express';
import { renderMembershipCreate, renderMembershipHome, renderMembershipList} from '../controllers/membershipController.js';
import { authMiddleware, roleMiddleware } from '../../login/middlewares/accessDenied.js';
import { MembershipController } from '../controllers/createMemberController.js';

const routerMember = express.Router();


// Primero autenticación (todos deben estar logueados)
routerMember.use(authMiddleware);


// Rutas accesibles a TODOS los roles autenticados
routerMember.get('/memberships', renderMembershipHome);
routerMember.get('/memberships/createMembership', MembershipController.renderTiposMembresia);
routerMember.get('/memberships/listMembership', renderMembershipList);



routerMember.get("/memberships/tipos_membresia/:id", MembershipController.getTipoMembresiaById);




//post
routerMember.post("/memberships/createClient", MembershipController.createClient);
routerMember.post("/memberships/createMembership", MembershipController.createMembership);

export { routerMember };
