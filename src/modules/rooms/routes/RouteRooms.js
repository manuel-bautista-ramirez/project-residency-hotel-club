import express from 'express';
import {
  renderHabitacionesView,
  renderPreciosView,
  renderReservacionesView,
  renderRentasView,
  renderMembershipsView,
  getHabitaciones,
  getPrecios,
  getReservaciones,
  getRentas,
  setEstadoHabitacion
} from '../controllers/roomsController.js';
import { authMiddleware, roleMiddleware } from '../../login/middlewares/accessDenied.js';

const routerRoom = express.Router();

// Middleware general para todas las rutas de rooms
routerRoom.use(authMiddleware);
routerRoom.use(roleMiddleware('Administrador'));

// Vistas
routerRoom.get('/rooms', renderHabitacionesView);
routerRoom.get('/precios', renderPreciosView);
routerRoom.get('/reservaciones', renderReservacionesView);
routerRoom.get('/rentas', renderRentasView);
routerRoom.get('/memberships', renderMembershipsView);

// API JSON
routerRoom.get('/api/rooms', async (req, res) => {
  res.json(await getHabitaciones());
});
routerRoom.get('/api/precios', async (req, res) => {
  res.json(await getPrecios());
});
routerRoom.get('/api/reservaciones', async (req, res) => {
  res.json(await getReservaciones());
});
routerRoom.get('/api/rentas', async (req, res) => {
  res.json(await getRentas());
});

// Cambiar estado de habitación
routerRoom.post('/api/rooms/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const hab = await setEstadoHabitacion(Number(id), estado);
  if (hab) {
    res.json({ success: true, habitacion: hab });
  } else {
    res.status(404).json({ success: false, message: 'Habitación no encontrada' });
  }
});

// Crear reservación (simulado)
routerRoom.post('/api/reservaciones', (req, res) => {
  res.status(201).json({ success: true, message: 'Reservación creada (simulado)' });
});

// Crear renta (simulado)
routerRoom.post('/api/rentas', (req, res) => {
  res.status(201).json({ success: true, message: 'Renta creada (simulado)' });
});

// Reporte habitaciones (simulado)
routerRoom.get('/api/reportes/habitaciones', async (req, res) => {
  const habitaciones = await getHabitaciones();
  res.json({ total: habitaciones.length, habitaciones });
});

// 404 handler para rooms
routerRoom.use((req, res) => res.status(404).render('error404', { title: 'Página no encontrada' }));

export { routerRoom };
