// routerRoom.js
import express from "express";
import {
  authMiddleware,
  roleMiddleware,
} from "../../login/middlewares/accessDenied.js";
import {
  renderHabitacionesView,
  renderPreciosView,
  renderReservacionesView,
  renderFormReservar,
  renderFormRentar,
  renderFormEditarRenta,
  getHabitaciones,
  setEstadoHabitacion,
  crearReservacion,
  crearRenta,
  updateRenta,
  deleteRenta,
} from "../controllers/roomsController.js";

const routerRoom = express.Router();

// --- Middleware de autenticación para todas las rutas ---
routerRoom.use(authMiddleware);

// ----- VISTAS PRINCIPALES -----
routerRoom.get("/rooms", renderHabitacionesView);

routerRoom.get(
  "rooms/precios",
  roleMiddleware("Administrador"),
  renderPreciosView
);
routerRoom.get("/rooms/reportes", renderReservacionesView);

// ----- FORMULARIOS INDIVIDUALES -----
routerRoom.get("/rooms/reservar/:id", renderFormReservar);
routerRoom.get("/rooms/rentar/:id", renderFormRentar);
routerRoom.get("/rooms/editar/:id", renderFormEditarRenta);

// ----- API -----

// Obtener habitaciones
routerRoom.get("/api/rooms", getHabitaciones);

// Cambiar estado de habitación (solo Administrador)
routerRoom.post(
  "/api/rooms/:id/estado",
  roleMiddleware("Administrador"),
  async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const hab = await setEstadoHabitacion(Number(id), estado);
    if (hab) return res.json({ success: true, habitacion: hab });
    return res
      .status(404)
      .json({ success: false, message: "Habitación no encontrada" });
  }
);

// Crear reservación
routerRoom.post("/api/rooms/reservar", async (req, res) => {
  const usuario_id = req.session.user?.id;
  if (!usuario_id)
    return res
      .status(401)
      .json({ success: false, message: "Usuario no logeado" });

  const { habitacion_id, nombre_cliente, fecha_ingreso, fecha_salida } =
    req.body;

  if (!habitacion_id || !nombre_cliente || !fecha_ingreso || !fecha_salida) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Faltan datos para crear la reservación",
      });
  }

  const nuevaReserva = await crearReservacion({
    habitacion_id,
    usuario_id,
    nombre_cliente,
    fecha_ingreso,
    fecha_salida,
  });
  if (nuevaReserva)
    return res.status(201).json({ success: true, reservacion: nuevaReserva });
  return res
    .status(400)
    .json({
      success: false,
      message:
        "No se pudo crear la reservación (habitacion ocupada o inválida)",
    });
});

// Crear renta
routerRoom.post("/api/rentas", async (req, res) => {
  const usuario_id = req.session.user?.id;
  if (!usuario_id)
    return res
      .status(401)
      .json({ success: false, message: "Usuario no logeado" });

  const {
    habitacion_id,
    nombre_cliente,
    fecha_ingreso,
    fecha_salida,
    tipo_pago,
    monto,
  } = req.body;
  if (
    !habitacion_id ||
    !nombre_cliente ||
    !fecha_ingreso ||
    !fecha_salida ||
    !tipo_pago
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan datos para crear la renta" });
  }

  const rentaCreada = await crearRenta({
    habitacion_id,
    usuario_id,
    nombre_cliente,
    fecha_ingreso,
    fecha_salida,
    tipo_pago,
    monto,
  });
  if (rentaCreada)
    return res.status(201).json({ success: true, renta: rentaCreada });
  return res
    .status(400)
    .json({
      success: false,
      message: "No se pudo crear la renta (habitacion ocupada o inválida)",
    });
});

// Editar renta
routerRoom.post("/api/rentas/:id/editar", async (req, res) => {
  const usuario_id = req.session.user?.id;
  if (!usuario_id) return res.status(401).send("Usuario no logeado");

  const rentaId = Number(req.params.id);
  const { nombre_cliente, fecha_ingreso, fecha_salida, tipo_pago, monto } =
    req.body;

  const actualizado = await updateRenta({
    id: rentaId,
    usuario_id,
    nombre_cliente,
    fecha_ingreso,
    fecha_salida,
    tipo_pago,
    monto,
  });
  if (actualizado) return res.redirect("/rentas");
  return res.status(400).send("No se pudo actualizar la renta");
});

// Eliminar renta
routerRoom.post("/api/rentas/:id/eliminar", async (req, res) => {
  const usuario_id = req.session.user?.id;
  if (!usuario_id) return res.status(401).send("Usuario no logeado");

  const rentaId = Number(req.params.id);
  const eliminado = await deleteRenta(rentaId);
  if (eliminado) return res.redirect("/rentas");
  return res.status(404).send("Renta no encontrada o no se pudo eliminar");
});

export { routerRoom };
