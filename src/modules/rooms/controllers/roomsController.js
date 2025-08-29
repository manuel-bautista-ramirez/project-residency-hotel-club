// roomsController.js
import {Room } from "../models/ModelRoom.js"; // Ajusta la ruta según tu proyecto

/*** --- VISTAS PRINCIPALES --- ***/

export const renderHabitacionesView = async (req, res) => {
  try {
    const habitaciones = await Room.find();
    const user = req.session.user || { role: "Usuario" };

    res.render("habitaciones", {
      title: "Habitaciones",
      habitaciones,
      user: {
        ...user,
        rol: user.role
      }
    });
  } catch (err) {
    console.error("Error al renderizar habitaciones:", err);
    return res.status(500).send("Error al cargar las habitaciones");
  }
};

export const renderPreciosView = async (req, res) => {
  try {
    const precios = await Room.precios();
    res.render("precios", { title: "Precios de Habitaciones", precios });
  } catch (err) {
    console.error("Error al renderizar precios:", err);
    return res.status(500).send("Error al cargar los precios");
  }
};

export const renderReservacionesView = async (req, res) => {
  try {
    res.render("reportes", { title: "reportes"});
  } catch (err) {
    console.error("Error al renderizar reportes de rentas:", err);
    return res.status(500).send("Error al cargar los reportes de rentas");
  }
};

export const renderRentasView = async (req, res) => {
  try {
    const rentas = await Room.rentas();
    const habitaciones = await Room.find();
    res.render("rentas", { title: "Rentas", rentas, habitaciones });
  } catch (err) {
    console.error("Error al renderizar rentas:", err);
    return res.status(500).send("Error al cargar las rentas");
  }
};

/*** --- FORMULARIOS INDIVIDUALES --- ***/

export const renderFormReservar = async (req, res) => {
  try {
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id)) return res.status(400).send("ID de habitación inválido");

    const habitaciones = await Room.find();
    const habitacion = habitaciones.find(h => Number(h.id) === habitacion_id);
    if (!habitacion) return res.status(404).send("Habitación no encontrada");

    return res.render("reservar", {
      title: "Reservar habitación",
      habitacion,
      habitaciones,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error en renderFormReservar:", err);
    return res.status(500).send("Error al cargar el formulario de reservación");
  }
};

export const renderFormRentar = async (req, res) => {
  try {
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id)) return res.status(400).send("ID de habitación inválido");

    const habitaciones = await Room.find();
    const habitacion = habitaciones.find(h => Number(h.id) === habitacion_id);
    if (!habitacion) return res.status(404).send("Habitación no encontrada");

    return res.render("rentar", {
      title: "Rentar habitación",
      habitacion,
      habitaciones,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error en renderFormRentar:", err);
    return res.status(500).send("Error al cargar el formulario de renta");
  }
};

export const renderFormEditarRenta = async (req, res) => {
  try {
    const rentaId = Number(req.params.id);
    if (Number.isNaN(rentaId)) return res.status(400).send("ID de renta inválido");

    const renta = await Room.findRentaById(rentaId);
    if (!renta) return res.status(404).send("Renta no encontrada");

    const habitaciones = await Room.find();

    return res.render("editarRenta", {
      title: "Editar Renta",
      renta,
      habitaciones,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error en renderFormEditarRenta:", err);
    return res.status(500).send("Error al cargar el formulario de edición de renta");
  }
};


export const renderCalendario = (req, res) => {
  res.render('calendario', { title: 'Calendario de Habitaciones' });
};

export const fetchEventos = async (req, res) => {
  try {
    const eventos = await Room.getEventosCalendario();
    res.json(eventos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
};

/*** --- API / LÓGICA --- ***/

export const getHabitaciones = async () => await Room.find();
export const getPrecios = async () => await Room.precios();
export const getReservaciones = async () => await Room.reservaciones();
export const getRentas = async () => await Room.rentas();
export const setEstadoHabitacion = async (id, estado) => await Room.setEstado(Number(id), estado);

export const crearReservacion = async ({ habitacion_id, usuario_id, nombre_cliente, correo_cliente, telefono_cliente, fecha_ingreso, fecha_salida, monto }) => {
  return await Room.crearReservacion({ habitacion_id, usuario_id, nombre_cliente, correo_cliente, telefono_cliente, fecha_ingreso, fecha_salida, monto });
};

export const crearRenta = async ({ habitacion_id, usuario_id, nombre_cliente, correo_cliente, telefono_cliente, fecha_ingreso, fecha_salida, tipo_pago, monto }) => {
  return await Room.crearRenta({ habitacion_id, usuario_id, nombre_cliente, correo_cliente, telefono_cliente, fecha_ingreso, fecha_salida, tipo_pago, monto });
};

export const obtenerPrecio = async (tipo, mes) => await Room.obtenerPrecio(tipo, mes);

export const getRentaById = async (id) => await Room.findRentaById(Number(id));
export const updateRenta = async (data) => await Room.updateRenta(Number(data.id), data);
export const deleteRenta = async (id) => await Room.deleteRenta(Number(id));
