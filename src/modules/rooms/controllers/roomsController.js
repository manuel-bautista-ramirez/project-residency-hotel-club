// roomsController.js
import {
  getHabitaciones,
  findReservacionById,
  getAllReservationes,
  getAllRentas,
  deletebyReservation,
  updateRoomStatus,
  deleteByIdRenta,
  createReservation,
  setNewPrice,
  getAllPrices,
  createRent,
  getPrecioPorTipoYMes,
  getRoomPriceByTypeAndMonth,
  createMessageMethod,
} from "../models/ModelRoom.js"; // Ajusta la ruta según tu proyecto

/*** --- VISTAS PRINCIPALES --- ***/
export const renderHabitacionesView = async (req, res) => {
  try {
    const user = req.session.user || { role: "Usuario" };
    const habitaciones = await getHabitaciones();

    res.render("ShowAllRooms", {
      title: "Habitaciones",
      showFooter: true,
      habitaciones,
      user: {
        ...user,
        rol: user.role,
      },
    });
  } catch (err) {
    console.error("Error al renderizar habitaciones:", err);
    res.status(500).send("Error al cargar las habitaciones");
  }
};
// change status
export const changesStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; //  "disponible"
  const success = await updateRoomStatus(id, status);

  console.log("Status change result:", success);

  if (success) {
    res.redirect("/rooms");
  } else {
    res.status(500).send("No se pudo actualizar el estado.");
  }
};

// set numbers to works
function convertMumbersWorks(numero) {
  const unidades = [
    "cero",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
    "veinte",
  ];
  if (numero >= 0 && numero <= 20) return unidades[numero];
  return numero.toString(); // Para números mayores, solo retorna el número como texto
}

// create new reservation by id Room
export const handleCreateReservation = async (req, res) => {
  try {
    // 1. Obtener el ID de la habitación desde la URL
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id)) {
      return res.status(400).send("ID de habitación inválido");
    }

    // 2. Obtener los datos del formulario
    const {
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso,
      fecha_salida,
      monto,
    } = req.body;

    // 3. Obtener el ID numérico del usuario autenticado
    const usuario_id = req.session.user?.id;
    console.log("Usuario ID from session:", usuario_id);

    // Validar que el usuario esté autenticado y el ID sea numérico
    if (!usuario_id || Number.isNaN(Number(usuario_id))) {
      return res.status(401).send("Usuario no autenticado o ID inválido");
    }

    // 4. Convertir el monto a letras
    const monto_letras = convertMumbersWorks(Number(monto) || 0);

    // 5. Construir el objeto de datos de la reservación
    const reservationData = {
      habitacion_id,
      usuario_id: Number(usuario_id), // Asegura que sea numérico
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso,
      fecha_salida,
      monto: Number(monto) || 0,
      monto_letras,
    };

    // 6. Crear la reservación en la base de datos
    const result = await createReservation(reservationData);

    // 7. Redireccionar o mostrar error
    if (result) {
      return res.redirect("/rooms");
    } else {
      return res.status(500).send("Error al crear la reservación...");
    }
  } catch (err) {
    console.error("Error handleCreateReservation:", err);
    return res.status(500).send("Error al crear la reservación...");
  }
};

// get all Reservaciones
export const renderAllRervationes = async (req, res) => {
  try {
    const user = req.session.user || { role: "Usuario" };
    const allReservationes = await getAllReservationes();

    res.render("showReservations", {
      title: "Adminstracion de  Reservaciones",
      allReservationes,
      user: {
        ...user,
        rol: user.role,
      },
    });
  } catch (error) {
    console.error("Error al renderrizar las reservaciones");
    res.status(500).send("Errror al cargar las reservaciones loco..");
  }
};

// delete by id reservation
export const deleteByIdResevation = async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    if (Number.isNaN(reservationId)) return res.status(400).send("ID inválido");

    const success = await deletebyReservation(reservationId);
    console.log("Delete reservation result:", success);

    if (success) {
      res.redirect("/rooms/list/reservations");
    } else {
      res.status(500).send("No se pudo eliminar la reservación");
    }
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).send("Error al eliminar la reservación");
  }
};

export const renderAllRentas = async (req, res) => {
  try {
    const user = req.session.user || { role: "Administrador" };
    const allRentas = await getAllRentas();
    console.log(allRentas);
    res.render("showRent", {
      title: "Listado de habitaciones rentadas",
      allRentas,
      showFooter: true,
      user: {
        ...user,
        rol: user.role,
      },
    });
  } catch (error) {
    console.error("Error al renderizar las rentas loco:", error.message);
    res.status(500).send("Error al cargar las rentas loco..");
  }
};

// delete by id renta
export const deleteIdRenta = async (req, res) => {
  try {
    const rentaId = Number(req.params.id);
    if (Number.isNaN(rentaId)) return res.status(400).send("ID inválido");

    const success = await deleteByIdRenta(rentaId);
    if (success) {
      res.redirect("/rooms/list/rentas"); // Ajusta la ruta según tu vista de rentas
    } else {
      res.status(500).send("No se pudo eliminar la renta");
    }
  } catch (err) {
    console.error("Error deleting renta:", err);
    res.status(500).send("Error al eliminar la renta");
  }
};

export const renderFormEditarReservacion = async (req, res) => {
  try {
    const reservacionId = Number(req.params.id);
    if (Number.isNaN(reservacionId))
      return res.status(400).send("ID de reservación inválido");

    const reservacion = await findReservacionById(reservacionId);
    if (!reservacion) return res.status(404).send("Reservación no encontrada");

    // Formatear fechas para inputs tipo date
    reservacion.fecha_ingreso = reservacion.fecha_ingreso
      .toISOString()
      .split("T")[0];
    reservacion.fecha_salida = reservacion.fecha_salida
      .toISOString()
      .split("T")[0];

    const habitaciones = await getHabitaciones();

    return res.render(" editReservation", {
      title: "Editar Reservación",
      showFooter: true,
      reservacion,
      habitaciones,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error en renderFormEditarReservacion:", err);
    return res
      .status(500)
      .send("Error al cargar el formulario de edición de reservación");
  }
};

export const renderReservacionesView = async (req, res) => {
  const user = req.session.user || { role: "Administrador" };
  try {
    res.render("reports", {
      title: "reportes",
      showFooter: true,
      user: {
        ...user,
        rol: user.role,
      },
    });
  } catch (err) {
    console.error("Error al renderizar reportes de rentas:", err);
    return res.status(500).send("Error al cargar los reportes de rentas");
  }
};

/*** --- FORMULARIOS INDIVIDUALES --- ***/

export const createResevation = async (req, res) => {
  try {
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id))
      return res.status(400).send("ID de habitación inválido");

    const habitaciones = await getHabitaciones();
    const habitacion = habitaciones.find((h) => Number(h.id) === habitacion_id);
    if (!habitacion) return res.status(404).send("Habitación no encontrada");

    return res.render("reserve", {
      title: "Reservar habitación",
      habitacion,
      habitaciones,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error en renderFormReservar:", err);
    return res.status(500).send("Error al cargar el formulario de reservación");
  }
};

export const renderFormRentar = async (req, res) => {
  try {
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id))
      return res.status(400).send("ID de habitación inválido");

    const habitaciones = await getHabitaciones();
    const habitacion = habitaciones.find((h) => Number(h.id) === habitacion_id);
    if (!habitacion) return res.status(404).send("Habitación no encontrada");

    // Obtener el mes actual
    const mesActual = new Date().getMonth() + 1;

    // Obtener el precio por tipo y mes actual
    const monto = (await getPrecioPorTipoYMes(habitacion.tipo, mesActual)) || 0;
    const monto_letras = numeroALetras(monto);

    return res.render("rent", {
      title: "Rentar habitación",
      showFooter: true,
      habitacion,
      monto,
      monto_letras,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error en renderFormRentar:", err);
    return res.status(500).send("Error al cargar el formulario de renta");
  }
};

// Helper para convertir números a letras (simplificado)
function numeroALetras(num) {
  return `${num} pesos`; // Implementa tu lógica si quieres algo más elaborado
}

// set new renta get mes , price , tyepe room

export const handleCreateRenta = async (req, res) => {
  // Obtener IDs y datos del formulario
  const habitacion_id = req.params.id;
  const usuario_id = req.session.user?.id;
  const {
    client_name,
    email,
    phone,
    check_in,
    check_out,
    payment_type,
    price,
    price_text,
  } = req.body;

  // Depuración: mostrar todos los datos recibidos
  console.log("=== Depuración de datos del formulario ===");
  console.log({
    habitacion_id,
    usuario_id,
    client_name,
    email,
    phone,
    check_in,
    check_out,
    payment_type,
    price,
    price_text,
  });
  console.log("=========================================");

  try {
    // 1. Insertar medio de mensaje
    const message_method_id = await createMessageMethod(email, phone);
    console.log("ID medio de mensaje creado:", message_method_id);

    // Crear un mapeo
    const paymentMap = {
      Card: "tarjeta",
      Transfer: "transferencia",
      Cash: "efectivo",
    };

    const tipo_pago = paymentMap[payment_type] || null;

    if (!tipo_pago) {
      return res.status(400).send("Tipo de pago inválido");
    }

    // 2. Insertar renta usando nombres correctos
    const rent_id = await createRent({
      room_id: habitacion_id,
      user_id: usuario_id,
      message_method_id: message_method_id,
      client_name: client_name,
      check_in_date: check_in,
      check_out_date: check_out,
      payment_type: tipo_pago,
      amount: price,
      amount_text: price_text,
    });

    console.log("Renta creada con ID:", rent_id);

    res.redirect("/rooms"); // redirigir o mostrar mensaje de éxito
  } catch (err) {
    console.error("Error creando la renta:", err);
    res.status(500).send("Error creando la renta");
  }
};

export const renderCalendario = (req, res) => {
  res.render("calendar", {
    title: "Calendario de Habitaciones",
    showFooter: true,
  });
};

export const fetchEventos = async (req, res) => {
  try {
    const eventos = await getEventosCalendario();
    res.json(eventos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los eventos" });
  }
};

// get all prices
export const renderAllPriceView = async (req, res) => {
  try {
    const precios = await getAllPrices();
    res.render("prices", {
      title: "Precios de Habitaciones",
      showFooter: true,
      meses: precios, // <-- ENVÍA COMO 'meses' SI TU PLANTILLA USA {{#each meses}}
    });
  } catch (err) {
    console.error("Error al renderizar precios:", err);
    res.status(500).send("Error al cargar los precios");
  }
};

///  funciones de  asrconas  para vericar el estado  de disponibilidad  de las habitaciones y precios segun el mes.
// Comprobar disponibilidad
export const apiCheckAvailability = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const checkIn = req.query.check_in;
    const checkOut = req.query.check_out;

    // Aquí debes hacer la consulta real a la tabla de rentas o reservaciones
    // Por ejemplo:
    // SELECT * FROM rentas WHERE habitacion_id = ? AND (check_in < ? AND check_out > ?)
    // Para simplificar, devolvemos siempre disponible
    const available = true;

    res.json({ available });
  } catch (err) {
    console.error("Error en apiCheckAvailability:", err);
    res.json({ available: false, error: err.message });
  }
};

// Obtener precio por tipo de habitación y mes
export const apiGetPriceByMonth = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const month = Number(req.query.month);

    const rooms = await getHabitaciones();
    console.log("Habitaciones obtenidas:", rooms);

    const room = rooms.find((r) => Number(r.id) === roomId);
    if (!room) {
      console.log("Habitación no encontrada:", roomId);
      return res.json({ price: 0, price_text: "" });
    }

    // ⚠ Usamos la columna correcta: 'tipo'
    const roomType = room.tipo;
    console.log("Buscando precio para tipo:", roomType, "mes:", month);

    const price =
      (await getRoomPriceByTypeAndMonth(roomType.trim(), month)) || 0;
    const price_text = `${price} pesos`;

    res.json({ price, price_text });
  } catch (err) {
    console.error("Error en apiGetPriceByMonth:", err);
    res.json({ price: 0, price_text: "", error: err.message });
  }
};

export const renderRentForm = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    if (Number.isNaN(roomId)) return res.status(400).send("Invalid room ID");

    const rooms = await getHabitaciones();
    const room = rooms.find((r) => Number(r.id) === roomId);
    if (!room) return res.status(404).send("Room not found");

    const currentMonth = new Date().getMonth() + 1;
    const price =
      (await getRoomPriceByTypeAndMonth(room.type, currentMonth)) || 0;
    const price_text = `${price} pesos`;

    return res.render("rent", {
      title: "Rent Room",
      showFooter: true,
      room,
      price,
      price_text,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error in renderRentForm:", err);
    return res.status(500).send("Error loading rent form");
  }
};


