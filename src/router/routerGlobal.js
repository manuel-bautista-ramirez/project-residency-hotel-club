import express from "express";
import routerLogin from "../modules/login/routers/routerLogin.js";
import { routerMember } from "../modules/membership/routes/membershipRoutes.js";
import { routerRoom } from "../modules/rooms/routes/RouteRooms.js";

const routerGlobal = express.Router();

// Aquí se van  a importar  todos los routes de los modulos, sin necesidad que modificar nada el index.js 
routerGlobal.use(routerLogin);
routerGlobal.use(routerMember);
routerGlobal.use(routerRoom);

export { routerGlobal };
