import express from 'express';
import {
  renderHabitacionesView,
  renderPreciosView,
  renderReservacionesView,
  renderRentasView,
  renderMembershipsView
} from '../controllers/roomsController.js';
import { authMiddleware, roleMiddleware } from '../../login/middlewares/accessDenied.js';

const routerRoom = express.Router();

// Middleware general para todas las rutas de rooms
routerRoom.use(authMiddleware);
routerRoom.use(roleMiddleware('Administrador'));

// Rutas del módulo rooms
routerRoom.get('/rooms', renderHabitacionesView);
routerRoom.get('/precios', renderPreciosView);
routerRoom.get('/reservaciones', renderReservacionesView);
routerRoom.get('/rentas', renderRentasView);
routerRoom.get('/memberships', renderMembershipsView);

// 404 handler para rooms
routerRoom.use((req, res) => res.status(404).render('error404', { title: 'Página no encontrada' }));

export { routerRoom };
