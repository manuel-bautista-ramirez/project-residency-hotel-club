// routerRoom.js
import express from "express";
import { authMiddleware, roleMiddleware } from '../../login/middlewares/accessDenied.js';
import {
  renderHabitacionesView,
  getHabitaciones,
  setEstadoHabitacion,
  crearReservacion,
  crearRenta
} from "../controllers/roomsController.js";

const routerRoom = express.Router();

// Aplicar authMiddleware para todas las rutas del módulo
routerRoom.use(authMiddleware);

// Vista principal de habitaciones
routerRoom.get("/rooms", renderHabitacionesView);

// API para obtener habitaciones
routerRoom.get("/api/rooms", async (req, res) => {
  const habitaciones = await getHabitaciones();
  res.json(habitaciones);
});

// Cambiar estado de habitación (solo superadmin)
routerRoom.post("/api/rooms/:id/estado", roleMiddleware("superadmin"), async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const hab = await setEstadoHabitacion(Number(id), estado);
  if (hab) res.json({ success: true, habitacion: hab });
  else res.status(404).json({ success: false, message: "Habitación no encontrada" });
});

// Crear reservación
routerRoom.post("/api/rooms/reservar", async (req, res) => {
  try {
    // Obtener usuario logeado de la sesión
    const usuario_id = req.session.user?.id;
    if (!usuario_id) {
      return res.status(401).json({ success: false, message: "Usuario no logeado" });
    }

    // Llamar al controlador pasando el usuario_id desde sesión
    const { habitacion_id, nombre_cliente, fecha_ingreso, fecha_salida } = req.body;
    const nuevaReserva = await crearReservacion({
      habitacion_id: Number(habitacion_id),
      usuario_id: Number(usuario_id),
      nombre_cliente,
      fecha_ingreso,
      fecha_salida
    });

    if (nuevaReserva) res.status(201).json({ success: true, reservacion: nuevaReserva });
    else res.status(400).json({ success: false, message: "No se pudo crear la reservación (habitacion ocupada o inválida)" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// Crear renta
routerRoom.post("/api/rentas", async (req, res) => {
  const user_id = req.session.user.id;
  const renta = await crearRenta({ ...req.body, usuario_id: user_id });
  if (renta) res.status(201).json({ success: true, renta });
  else res.status(400).json({ success: false, message: "No se pudo crear la renta" });
});

export { routerRoom };
