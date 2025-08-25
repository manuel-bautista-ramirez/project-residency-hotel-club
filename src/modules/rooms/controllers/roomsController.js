import {roleMiddleware ,authMiddleware} from '../../login/middlewares/accessDenied.js';
import Room, { memberships } from '../models/ModelRoom.js';


// Helper para correr middlewares dentro de un controlador
function runMiddleware(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Obtener todas las habitaciones
export async function getHabitaciones() {
  return await Room.find();
}

// Obtener todos los precios
export async function getPrecios() {
  return await Room.precios();
}

// Obtener todas las reservaciones
export async function getReservaciones() {
  return await Room.reservaciones();
}

// Obtener todas las rentas
export async function getRentas() {
  return await Room.rentas();
}

// Cambiar estado de una habitación
export async function setEstadoHabitacion(id, nuevoEstado) {
  return await Room.setEstado(id, nuevoEstado);
}

export async function renderHabitacionesView(req, res) {
  try {
    await runMiddleware(req, res, authMiddleware);
    const habitaciones = await Room.find();
    res.render("habitaciones", { habitaciones, user: req.user });
  } catch (err) {
    console.error("Error en autenticación:", err.message);
  }
}

export async function renderPreciosView(req, res) {
  try {
    await runMiddleware(req, res, authMiddleware);
    const precios = await Room.precios();
    res.render("precios", { precios, user: req.user });
  } catch (err) {
    console.error("Error en autenticación:", err.message);
  }
}

export async function renderReservacionesView(req, res) {
  try {
    await runMiddleware(req, res, authMiddleware);
    const reservaciones = await Room.reservaciones();
    res.render("reservaciones", { reservaciones, user: req.user });
  } catch (err) {
    console.error("Error en autenticación:", err.message);
  }
}

export async function renderRentasView(req, res) {
  try {
    await runMiddleware(req, res, authMiddleware);
    const rentas = await Room.rentas();
    res.render("rentas", { rentas, user: req.user });
  } catch (err) {
    console.error("Error en autenticación:", err.message);
  }
}

export async function renderMembershipsView(req, res) {
  try {
    await runMiddleware(req, res, authMiddleware);
    res.render("memberships", { memberships, user: req.user });
  } catch (err) {
    console.error("Error en autenticación:", err.message);
  }
}

