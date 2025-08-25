// roomsController.js
import Room from "../models/ModelRoom.js"; // Modelo simulado


// --- VISTAS ---

// Renderizar vista de habitaciones
export const renderHabitacionesView = async (req, res) => {
  const habitaciones = await Room.find();
  res.render("habitaciones", { title: "Habitaciones", habitaciones });
};
export const getRooms = async (req, res) => {
  const habitaciones = await Room.find();
  const reservaciones = await Room.reservaciones();

  // Crear un mapa de id -> numero
  const habitacionesMap = {};
  habitaciones.forEach(h => {
    habitacionesMap[h.id] = h.numero;
  });

  res.render('rooms', {
    user: req.session.user,
    habitaciones,
    reservaciones,
    habitacionesMap
  });
};

// Renderizar vista de precios
export const renderPreciosView = async (req, res) => {
  const precios = await Room.precios();
  res.render("precios", { title: "Precios de Habitaciones", precios });
};

// Renderizar vista de reservaciones
export const renderReservacionesView = async (req, res) => {
  const reservaciones = await Room.reservaciones();
  const habitaciones = await Room.find();
  res.render("reservaciones", { title: "Reservaciones", reservaciones, habitaciones });
};

// Renderizar vista de rentas
export const renderRentasView = async (req, res) => {
  const rentas = await Room.rentas();
  const habitaciones = await Room.find();
  res.render("rentas", { title: "Rentas", rentas, habitaciones });
};

// --- API / LÓGICA ---

// Obtener todas las habitaciones
export const getHabitaciones = async () => {
  return await Room.find();
};

// Obtener precios
export const getPrecios = async () => {
  return await Room.precios();
};

// Obtener reservaciones
export const getReservaciones = async () => {
  return await Room.reservaciones();
};

// Obtener rentas
export const getRentas = async () => {
  return await Room.rentas();
};

// Cambiar estado de habitación
export const setEstadoHabitacion = async (id, estado) => {
  return await Room.setEstado(id, estado);
};

// Crear reservación
export const crearReservacion = async ({ habitacion_id, usuario_id, nombre_cliente, fecha_ingreso, fecha_salida }) => {
  return await Room.crearReservacion({
    habitacion_id,
    usuario_id,
    nombre_cliente,
    fecha_ingreso,
    fecha_salida
  });
};

// Crear renta
export const crearRenta = async (req, res) => {
  const { habitacion_id, usuario_id, nombre_cliente, fecha_ingreso, fecha_salida, tipo_pago } = req.body;

  const nuevaRenta = await Room.crearRenta({
    habitacion_id: Number(habitacion_id),
    usuario_id: Number(usuario_id),
    nombre_cliente,
    fecha_ingreso,
    fecha_salida,
    tipo_pago
  });

  if (nuevaRenta) {
    res.status(201).json({ success: true, renta: nuevaRenta });
  } else {
    res.status(400).json({ success: false, message: "No se pudo crear la renta (habitacion ocupada o inválida)" });
  }
};

// Obtener precio vigente por tipo y mes
export const obtenerPrecio = async (tipo, mes) => {
  return await Room.obtenerPrecio(tipo, mes);
};
