// roomsController.js
import {
  getHabitaciones,
  findReservacionById,
  getAllReservationes,
  getAllRentas,
  deletebyReservation,
  updateRoomStatus,
  createReservation,
  setNewPrice,
  getAllPrices,
  getPrecioPorTipoYMes,
  getRoomPriceByTypeAndMonth,
  createMessageMethod,
  checkRoomAvailability,
  createRent,
  deleteByIdRenta,
  updateReservation,
  updateRent,
} from "../models/ModelRoom.js"; // Ajusta la ruta según tu proyecto

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

// Helper para convertir números a letras (mejorada)
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

  const decenas = [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ];

  if (numero >= 0 && numero <= 20) return unidades[numero];
  if (numero > 20 && numero < 100) {
    const decena = Math.floor(numero / 10);
    const unidad = numero % 10;
    return unidad === 0
      ? decenas[decena]
      : `${decenas[decena]} y ${unidades[unidad]}`;
  }
  return `${numero} pesos`; // Para números mayores
}

// create new reservation by id Room
export const handleCreateReservation = async (req, res) => {
  try {
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id)) {
      return res.status(400).send("ID de habitación inválido");
    }

    const {
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso,
      fecha_salida,
      monto,
      send_email,
      send_whatsapp,
    } = req.body;

    const usuario_id = req.session.user?.id;
    console.log("Usuario ID from session:", usuario_id);

    if (!usuario_id || Number.isNaN(Number(usuario_id))) {
      return res.status(401).send("Usuario no autenticado o ID inválido");
    }

    // Formateo de fechas
    const fechaIngresoDate = new Date(fecha_ingreso);
    const fechaSalidaDate = new Date(fecha_salida);

    fechaIngresoDate.setUTCHours(18, 0, 0, 0);
    fechaSalidaDate.setUTCHours(18, 0, 0, 0);

    const formatUTCForMySQL = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
      const seconds = String(date.getUTCSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const fecha_ingreso_formatted = formatUTCForMySQL(fechaIngresoDate);
    const fecha_salida_formatted = formatUTCForMySQL(fechaSalidaDate);

    const monto_letras = convertMumbersWorks(Number(monto) || 0);

    const reservationData = {
      habitacion_id,
      usuario_id: Number(usuario_id),
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso: fecha_ingreso_formatted,
      fecha_salida: fecha_salida_formatted,
      monto: Number(monto) || 0,
      monto_letras,
    };

    console.log("📝 Creando reservación con datos:", reservationData);
    const reservationId = await createReservation(reservationData);

    if (!reservationId) {
      return res.status(500).send("Error al crear la reservación");
    }

    console.log(`✅ Reservación creada con ID: ${reservationId}`);

    // Obtener el número real de la habitación
    const { getRoomNumberById } = await import("../models/ModelRoom.js");
    const numeroHabitacion = await getRoomNumberById(habitacion_id);

    // Preparar datos para el PDF
    const datosParaPDF = {
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso,
      fecha_salida,
      monto,
      habitacion_id,
      numero_habitacion: numeroHabitacion || habitacion_id, // Usar número real o ID como fallback
      tipo: "reservacion",
    };

    console.log("📄 Datos listos para PDF:", datosParaPDF);

    // Generar PDF y QR y enviar
    try {
      // ✅ CORREGIDO: Usar los nombres correctos de archivos
      const { generateAndSendPDF } = await import("../utils/pdfGenerator.js");
      const { generarQR } = await import("../utils/qrGenerator.js");
      const pdfEnvioService = await import("../utils/pdfEnvio.js").then(
        (module) => module.default
      );

      // ✅ CORREGIDO: Eliminar código duplicado - solo generar QR una vez
      const qrPath = await generarQR(datosParaPDF, 'reservacion');

      // ✅ CORREGIDO: Generar PDF con el QR
      const pdfPath = await generateAndSendPDF(datosParaPDF, 'reservacion', qrPath);

      console.log("✅ Comprobantes generados:");
      console.log("📄 PDF:", pdfPath);
      console.log("🔗 QR:", qrPath);

      // Guardar las rutas de los archivos en la base de datos
      await updateReservation(reservationId, {
        pdf_path: pdfPath,
        qr_path: qrPath,
      });
      console.log("✅ Rutas de archivos guardadas en la base de datos");

      // Opciones de envío
      const opcionesEnvio = {
        sendEmail: send_email,
        sendWhatsApp: send_whatsapp,
      };

      // Enviar comprobante
      const resultadosEnvio = await pdfEnvioService.enviarComprobanteReservacion(
        datosParaPDF,
        pdfPath,
        opcionesEnvio
      );

      console.log("📊 Resultados del envío:", resultadosEnvio);
    } catch (pdfError) {
      console.error("❌ Error generando/enviando comprobante:", pdfError);
      // No detenemos el flujo principal si falla el PDF
    }

    return res.redirect("/rooms");
  } catch (err) {
    console.error("Error en handleCreateReservation:", err);
    return res.status(500).send("Error interno del servidor");
  }
};

// get all Reservaciones
export const renderAllRervationes = async (req, res) => {
  try {
    const user = req.session.user || { role: "Usuario" };
    const allReservationes = await getAllReservationes();

    const reservacionesFormateadas = allReservationes.map((reservacion) => ({
      ...reservacion,
      fecha_reserva: reservacion.fecha_reserva
        ? new Date(reservacion.fecha_reserva).toISOString()
        : null,
      fecha_ingreso: reservacion.fecha_ingreso
        ? new Date(reservacion.fecha_ingreso).toISOString()
        : null,
      fecha_salida: reservacion.fecha_salida
        ? new Date(reservacion.fecha_salida).toISOString()
        : null,
    }));

    res.render("showReservations", {
      title: "Adminstracion de  Reservaciones",
      allReservationes: reservacionesFormateadas,
      user: {
        ...user,
        rol: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Error al renderrizar las reservaciones:",
      error?.message || error
    );
    res.status(500).send("Error al cargar las reservaciones");
  }
};

// delete by id reservation
export const deleteByIdResevation = async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    if (Number.isNaN(reservationId)) return res.status(400).send("ID inválido");

    const success = await deletebyReservation(reservationId);

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

    // Convertir fechas a formato ISO string para preservar la hora en los atributos HTML
    const rentasFormateadas = allRentas.map((renta) => ({
      ...renta,
      fecha_ingreso: renta.fecha_ingreso
        ? new Date(renta.fecha_ingreso).toISOString()
        : null,
      fecha_salida: renta.fecha_salida
        ? new Date(renta.fecha_salida).toISOString()
        : null,
    }));

    console.log(rentasFormateadas);
    res.render("showRent", {
      title: "Listado de habitaciones rentadas",
      allRentas: rentasFormateadas,
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

// Procesar la edición de una reservación
export const handleEditReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_cliente,
      fecha_ingreso,
      fecha_salida,
      habitacion_id,
      monto,
      monto_letras,
      send_email,
      send_whatsapp,
    } = req.body;

    console.log(`📝 Editando reservación ${id}...`);
    console.log("📦 Datos recibidos:", req.body);

    // Formatear fechas para MySQL
    const fechaIngresoDate = new Date(fecha_ingreso);
    const fechaSalidaDate = new Date(fecha_salida);

    const formatUTCForMySQL = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day} 12:00:00`;
    };

    const fecha_ingreso_formatted = formatUTCForMySQL(fechaIngresoDate);
    const fecha_salida_formatted = formatUTCForMySQL(fechaSalidaDate);

    // Datos para actualizar
    const reservationData = {
      nombre_cliente,
      fecha_ingreso: fecha_ingreso_formatted,
      fecha_salida: fecha_salida_formatted,
      habitacion_id,
      monto,
      monto_letras,
    };

    // Obtener datos completos de la reservación ANTES de actualizar (para eliminar archivos antiguos)
    const reservacionAnterior = await findReservacionById(id);
    
    // Actualizar la reservación
    await updateReservation(id, reservationData);
    console.log("✅ Reservación actualizada exitosamente");

    // Obtener datos completos de la reservación actualizada para el PDF
    const reservacionActualizada = await findReservacionById(id);
    
    // Obtener el número real de la habitación
    const { getRoomNumberById } = await import("../models/ModelRoom.js");
    const numeroHabitacion = await getRoomNumberById(habitacion_id);

    // Preparar datos para el PDF
    const datosParaPDF = {
      nombre_cliente,
      correo: reservacionActualizada.correo_cliente,
      telefono: reservacionActualizada.telefono_cliente,
      fecha_ingreso: fecha_ingreso,
      fecha_salida: fecha_salida,
      monto,
      habitacion_id,
      numero_habitacion: numeroHabitacion || habitacion_id,
      tipo: "reservacion",
    };

    console.log("📄 Datos listos para PDF actualizado:", datosParaPDF);

    // Generar y enviar PDF actualizado
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { generateAndSendPDF } = await import("../utils/pdfGenerator.js");
      const { generarQR } = await import("../utils/qrGenerator.js");
      const validadorDirectorios = (await import("../utils/validadorDirectorios.js")).default;
      const envioPdfService = await import("../utils/pdfEnvio.js").then(
        (module) => module.default
      );

      // 🗑️ ELIMINAR ARCHIVOS ANTERIORES
      console.log("🗑️ Eliminando archivos anteriores...");
      
      try {
        // Eliminar PDF anterior si existe
        if (reservacionAnterior.pdf_path && fs.existsSync(reservacionAnterior.pdf_path)) {
          fs.unlinkSync(reservacionAnterior.pdf_path);
          console.log(`✅ PDF anterior eliminado: ${reservacionAnterior.pdf_path}`);
        }
        
        // Eliminar QR anterior si existe
        if (reservacionAnterior.qr_path && fs.existsSync(reservacionAnterior.qr_path)) {
          fs.unlinkSync(reservacionAnterior.qr_path);
          console.log(`✅ QR anterior eliminado: ${reservacionAnterior.qr_path}`);
        }
      } catch (cleanupError) {
        console.warn("⚠️ Error al eliminar archivos anteriores:", cleanupError.message);
      }

      // Generar nuevos archivos
      console.log("📝 Generando nuevos comprobantes...");
      
      // Generar QR
      const qrPath = await generarQR(datosParaPDF, "reservacion");
      // Generar PDF
      const pdfPath = await generateAndSendPDF(datosParaPDF, "reservacion", qrPath);

      console.log("✅ Comprobantes actualizados generados:");
      console.log("📄 PDF:", pdfPath);
      console.log("🔗 QR:", qrPath);

      // Guardar las rutas de los nuevos archivos en la base de datos
      await updateReservation(id, {
        pdf_path: pdfPath,
        qr_path: qrPath,
      });
      console.log("✅ Rutas de archivos guardadas en la base de datos");

      // Opciones de envío
      const opcionesEnvio = {
        sendEmail: send_email === "on",
        sendWhatsApp: send_whatsapp === "on",
      };

      // Enviar comprobante actualizado
      const resultadosEnvio = await envioPdfService.enviarComprobanteReservacion(
        datosParaPDF,
        pdfPath,
        opcionesEnvio
      );

      console.log("📧 Resultados de envío:", resultadosEnvio);
    } catch (pdfError) {
      console.error("❌ Error al generar/enviar PDF:", pdfError);
      // Aunque falle el PDF, la reservación ya se actualizó
    }

    res.redirect("/rooms/list/reservations");
  } catch (error) {
    console.error("❌ Error al editar reservación:", error);
    res.status(500).send("Error al editar la reservación");
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
    send_email,
    send_whatsapp,
  } = req.body;

  console.log("📝 Datos recibidos para renta:", {
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

  try {
    // Formateo de fechas
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    checkInDate.setUTCHours(18, 0, 0, 0);
    checkOutDate.setUTCHours(18, 0, 0, 0);

    const formatUTCForMySQL = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
      const seconds = String(date.getUTCSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const check_in_formatted = formatUTCForMySQL(checkInDate);
    const check_out_formatted = formatUTCForMySQL(checkOutDate);

    // 1. Insertar medio de mensaje
    const message_method_id = await createMessageMethod(email, phone);
    console.log("ID medio de mensaje creado:", message_method_id);

    // Mapeo de tipos de pago
    const paymentMap = {
      Card: "tarjeta",
      Transfer: "transferencia",
      Cash: "efectivo",
    };

    const tipo_pago = paymentMap[payment_type] || null;

    if (!tipo_pago) {
      return res.status(400).send("Tipo de pago inválido");
    }

    // 2. Insertar renta
    const rentData = {
      room_id: habitacion_id,
      user_id: usuario_id,
      message_method_id: message_method_id,
      client_name: client_name,
      check_in_date: check_in_formatted,
      check_out_date: check_out_formatted,
      payment_type: tipo_pago,
      amount: price,
      amount_text: price_text,
    };

    console.log("📝 Creando renta con datos:", rentData);
    const rent_id = await createRent(rentData);
    console.log("✅ Renta creada con ID:", rent_id);

    // Obtener el número real de la habitación
    const { getRoomNumberById } = await import("../models/ModelRoom.js");
    const numeroHabitacion = await getRoomNumberById(habitacion_id);

    // Preparar datos para el PDF
    const datosParaPDF = {
      client_name,
      email,
      phone,
      check_in,
      check_out,
      payment_type: tipo_pago,
      price,
      habitacion_id,
      numero_habitacion: numeroHabitacion || habitacion_id, // Usar número real o ID como fallback
      tipo: "renta",
    };

    console.log("📄 Datos listos para PDF:", datosParaPDF);

    // Generar PDF y QR y enviar
    try {
      const { generateAndSendPDF } = await import("../utils/pdfGenerator.js");
      const { generarQR } = await import("../utils/qrGenerator.js");
      const envioPdfService = await import("../utils/pdfEnvio.js").then(
        (module) => module.default
      );

      // Generar PDF
      const qrPath = await generarQR(datosParaPDF, "renta");
      // Generar QR
      const pdfPath = await generateAndSendPDF(datosParaPDF, "renta", qrPath);

      console.log("✅ Comprobantes generados:");
      console.log("📄 PDF:", pdfPath);
      console.log("🔗 QR:", qrPath);

      // Opciones de envío
      const opcionesEnvio = {
        sendEmail: send_email,
        sendWhatsApp: send_whatsapp,
      };

      // Enviar comprobante
      const resultadosEnvio = await envioPdfService.enviarComprobanteRenta(
        datosParaPDF,
        pdfPath,
        opcionesEnvio
      );

      console.log("📊 Resultados del envío:", resultadosEnvio);
    } catch (pdfError) {
      console.error("❌ Error generando/enviando comprobante:", pdfError);
      // No detenemos el flujo principal si falla el PDF
    }

    res.redirect("/rooms");
  } catch (err) {
    console.error("Error creando la renta:", err);

    if (err.message && err.message.includes("no está disponible")) {
      return res
        .status(409)
        .send(
          `<script>alert('${err.message}'); window.location.href='/rooms';</script>`
        );
    }

    return res.status(500).send("Error creando la renta");
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
    const excludeReservationId = req.query.exclude_reservation_id ? Number(req.query.exclude_reservation_id) : null;

    if (!checkIn || !checkOut) {
      return res.json({ available: false, error: "Fechas no proporcionadas" });
    }

    // Verificar disponibilidad usando la función del modelo
    const available = await checkRoomAvailability(roomId, checkIn, checkOut, excludeReservationId);

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

// Actualizar precio individual
export const apiUpdatePrice = async (req, res) => {
  try {
    const { tipo, mes, monto } = req.body;

    if (!tipo || !mes || monto === undefined) {
      return res.json({ success: false, error: "Datos incompletos" });
    }

    const result = await setNewPrice({
      tipo_habitacion: tipo,
      mes: Number(mes),
      monto: Number(monto),
    });

    if (result) {
      res.json({ success: true, message: "Precio actualizado correctamente" });
    } else {
      res.json({ success: false, error: "Error al actualizar el precio" });
    }
  } catch (err) {
    console.error("Error en apiUpdatePrice:", err);
    res.json({ success: false, error: err.message });
  }
};

// Actualizar múltiples precios
export const apiUpdatePricesBulk = async (req, res) => {
  try {
    const { changes } = req.body;

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return res.json({
        success: false,
        error: "No hay cambios para procesar",
      });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const change of changes) {
      const { tipo, mes, monto } = change;
      try {
        const result = await setNewPrice({
          tipo_habitacion: tipo,
          mes: Number(mes),
          monto: Number(monto),
        });
        if (result) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error(`Error actualizando precio ${tipo}-${mes}:`, err);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      res.json({
        success: true,
        message: `${successCount} precios actualizados correctamente`,
      });
    } else {
      res.json({
        success: false,
        error: `${errorCount} errores, ${successCount} éxitos`,
      });
    }
  } catch (err) {
    console.error("Error en apiUpdatePricesBulk:", err);
    res.json({ success: false, error: err.message });
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

// ===== NUEVAS FUNCIONES PARA REPORTES Y MENSAJERÍA =====

/**
 * Genera y renderiza reportes
 */
export const generateReport = async (req, res) => {
  try {
    const { tipo, fechaInicio, fechaFin, habitacion, cliente, tipoPago } =
      req.query;

    const filtros = {};
    if (habitacion) filtros.habitacion = habitacion;
    if (cliente) filtros.cliente = cliente;
    if (tipoPago) filtros.tipoPago = tipoPago;

    let reporte;

    switch (tipo) {
      case "rentas":
        reporte = await ReportService.generateRentReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      case "reservaciones":
        reporte = await ReportService.generateReservationReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      case "consolidado":
        reporte = await ReportService.generateConsolidatedReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      default:
        return res.status(400).json({ error: "Tipo de reporte no válido" });
    }

    res.json({
      success: true,
      reporte,
    });
  } catch (error) {
    console.error("Error generando reporte:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar el reporte",
      details: error.message,
    });
  }
};

/**
 * Envía reporte por correo electrónico
 */
export const sendReportByEmail = async (req, res) => {
  try {
    const {
      tipo,
      fechaInicio,
      fechaFin,
      destinatario,
      asunto,
      filtros = {},
    } = req.body;

    // Generar el reporte
    let reporte;
    switch (tipo) {
      case "rentas":
        reporte = await ReportService.generateRentReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      case "reservaciones":
        reporte = await ReportService.generateReservationReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      case "consolidado":
        reporte = await ReportService.generateConsolidatedReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      default:
        return res.status(400).json({ error: "Tipo de reporte no válido" });
    }

    // Enviar por correo
    await ReportService.sendReportByEmail(reporte, destinatario, asunto);

    res.json({
      success: true,
      message: "Reporte enviado por correo exitosamente",
    });
  } catch (error) {
    console.error("Error enviando reporte por correo:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el reporte por correo",
      details: error.message,
    });
  }
};

/**
 * Envía reporte por WhatsApp
 */
export const sendReportByWhatsApp = async (req, res) => {
  try {
    const { tipo, fechaInicio, fechaFin, telefono, filtros = {} } = req.body;

    // Generar el reporte
    let reporte;
    switch (tipo) {
      case "rentas":
        reporte = await ReportService.generateRentReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      case "reservaciones":
        reporte = await ReportService.generateReservationReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      case "consolidado":
        reporte = await ReportService.generateConsolidatedReport(
          fechaInicio,
          fechaFin,
          filtros
        );
        break;
      default:
        return res.status(400).json({ error: "Tipo de reporte no válido" });
    }

    // Enviar por WhatsApp
    const result = await ReportService.sendReportByWhatsApp(reporte, telefono);

    res.json({
      success: true,
      message: "Reporte enviado por WhatsApp exitosamente",
      whatsappURL: result.whatsappURL,
    });
  } catch (error) {
    console.error("Error enviando reporte por WhatsApp:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el reporte por WhatsApp",
      details: error.message,
    });
  }
};

/**
 * Envía comprobante de renta por correo
 */
export const sendRentReceiptByEmail = async (req, res) => {
  try {
    const { rentaId } = req.params;
    const { destinatario } = req.body;

    // Obtener datos de la renta
    const rentas = await getAllRentas();
    const renta = rentas.find((r) => r.id_renta.toString() === rentaId);

    if (!renta) {
      return res.status(404).json({ error: "Renta no encontrada" });
    }

    await sendRentReceiptEmail({
      to: destinatario,
      subject: `Comprobante de Renta - Habitación ${renta.numero_habitacion}`,
      clienteNombre: renta.nombre_cliente,
      numeroHabitacion: renta.numero_habitacion,
      fechaIngreso: renta.fecha_ingreso,
      fechaSalida: renta.fecha_salida,
      tipoPago: renta.tipo_pago,
      monto: renta.monto,
      montoLetras: renta.monto_letras,
    });

    res.json({
      success: true,
      message: "Comprobante de renta enviado por correo exitosamente",
    });
  } catch (error) {
    console.error("Error enviando comprobante por correo:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el comprobante por correo",
      details: error.message,
    });
  }
};

/**
 * Envía comprobante de renta por WhatsApp
 */
export const sendRentReceiptByWhatsApp = async (req, res) => {
  try {
    const { rentaId } = req.params;
    const { telefono } = req.body;

    // Obtener datos de la renta
    const rentas = await getAllRentas();
    const renta = rentas.find((r) => r.id_renta.toString() === rentaId);

    if (!renta) {
      return res.status(404).json({ error: "Renta no encontrada" });
    }

    const result = await sendRentReceiptWhatsApp({
      phoneNumber: telefono,
      clienteNombre: renta.nombre_cliente,
      numeroHabitacion: renta.numero_habitacion,
      fechaIngreso: renta.fecha_ingreso,
      fechaSalida: renta.fecha_salida,
      tipoPago: renta.tipo_pago,
      monto: renta.monto,
      montoLetras: renta.monto_letras,
    });

    res.json({
      success: true,
      message: "Comprobante de renta enviado por WhatsApp exitosamente",
      whatsappURL: result.whatsappURL,
    });
  } catch (error) {
    console.error("Error enviando comprobante por WhatsApp:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el comprobante por WhatsApp",
      details: error.message,
    });
  }
};

/**
 * Envía comprobante de reservación por correo
 */
export const sendReservationReceiptByEmail = async (req, res) => {
  try {
    const { reservacionId } = req.params;
    const { destinatario } = req.body;

    // Obtener datos de la reservación
    const reservaciones = await getAllReservationes();
    const reservacion = reservaciones.find(
      (r) => r.id_reservacion.toString() === reservacionId
    );

    if (!reservacion) {
      return res.status(404).json({ error: "Reservación no encontrada" });
    }

    await sendReservationReceiptEmail({
      to: destinatario,
      subject: `Comprobante de Reservación - Habitación ${reservacion.numero_habitacion}`,
      clienteNombre: reservacion.nombre_cliente,
      numeroHabitacion: reservacion.numero_habitacion,
      fechaReserva: reservacion.fecha_reserva,
      fechaIngreso: reservacion.fecha_ingreso,
      fechaSalida: reservacion.fecha_salida,
      monto: reservacion.monto,
    });

    res.json({
      success: true,
      message: "Comprobante de reservación enviado por correo exitosamente",
    });
  } catch (error) {
    console.error("Error enviando comprobante por correo:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el comprobante por correo",
      details: error.message,
    });
  }
};

/**
 * Envía comprobante de reservación por WhatsApp
 */
export const sendReservationReceiptByWhatsApp = async (req, res) => {
  try {
    const { reservacionId } = req.params;
    const { telefono } = req.body;

    // Obtener datos de la reservación
    const reservaciones = await getAllReservationes();
    const reservacion = reservaciones.find(
      (r) => r.id_reservacion.toString() === reservacionId
    );

    if (!reservacion) {
      return res.status(404).json({ error: "Reservación no encontrada" });
    }

    const result = await sendReservationReceiptWhatsApp({
      phoneNumber: telefono,
      clienteNombre: reservacion.nombre_cliente,
      numeroHabitacion: reservacion.numero_habitacion,
      fechaReserva: reservacion.fecha_reserva,
      fechaIngreso: reservacion.fecha_ingreso,
      fechaSalida: reservacion.fecha_salida,
      monto: reservacion.monto,
    });

    res.json({
      success: true,
      message: "Comprobante de reservación enviado por WhatsApp exitosamente",
      whatsappURL: result.whatsappURL,
    });
  } catch (error) {
    console.error("Error enviando comprobante por WhatsApp:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el comprobante por WhatsApp",
      details: error.message,
    });
  }
};

/**
 * Envía recordatorio de check-in por WhatsApp
 */
export const sendCheckInReminder = async (req, res) => {
  try {
    const { reservacionId } = req.params;
    const { telefono } = req.body;

    // Obtener datos de la reservación
    const reservaciones = await getAllReservationes();
    const reservacion = reservaciones.find(
      (r) => r.id_reservacion.toString() === reservacionId
    );

    if (!reservacion) {
      return res.status(404).json({ error: "Reservación no encontrada" });
    }

    const result = await sendCheckInReminderWhatsApp({
      phoneNumber: telefono,
      clienteNombre: reservacion.nombre_cliente,
      numeroHabitacion: reservacion.numero_habitacion,
      fechaIngreso: reservacion.fecha_ingreso,
    });

    res.json({
      success: true,
      message: "Recordatorio de check-in enviado por WhatsApp exitosamente",
      whatsappURL: result.whatsappURL,
    });
  } catch (error) {
    console.error("Error enviando recordatorio por WhatsApp:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el recordatorio por WhatsApp",
      details: error.message,
    });
  }
};

/*** --- CONVERSIÓN DE RESERVACIÓN A RENTA --- ***/

// Renderizar formulario de conversión con datos de la reservación
export const renderConvertReservationToRent = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user || { role: "Administrador" };

    console.log(`📋 Cargando reservación ${id} para conversión a renta...`);

    const reservacion = await findReservacionById(id);

    if (!reservacion) {
      console.error(`❌ Reservación ${id} no encontrada`);
      return res.status(404).send("Reservación no encontrada");
    }

    console.log("✅ Reservación encontrada:", reservacion);

    // Formatear fechas al formato DD/MM/YYYY
    const formatearFecha = (fecha) => {
      const date = new Date(fecha);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const anio = date.getFullYear();
      return `${dia}/${mes}/${anio}`;
    };

    // Preparar datos formateados para la vista
    const reservacionFormateada = {
      ...reservacion,
      id_reservacion: reservacion.id,
      correo: reservacion.correo_cliente,
      telefono: reservacion.telefono_cliente,
      fecha_ingreso: formatearFecha(reservacion.fecha_ingreso),
      fecha_salida: formatearFecha(reservacion.fecha_salida),
    };

    console.log("✅ Reservación formateada:", reservacionFormateada);

    res.render("convertReservationToRent", {
      title: `Convertir Reservación #${id} a Renta`,
      showFooter: true,
      reservacion: reservacionFormateada,
      user: {
        ...user,
        rol: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error al cargar formulario de conversión:", error);
    res.status(500).send("Error al cargar el formulario de conversión");
  }
};

// Procesar la conversión de reservación a renta
export const handleConvertReservationToRent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_name,
      email,
      phone,
      check_in,
      check_out,
      habitacion_id_value,
      price,
      price_text,
      payment_type,
      send_email,
      send_whatsapp,
    } = req.body;

    console.log(`🔄 Convirtiendo reservación ${id} a renta...`);
    console.log("📦 Datos recibidos:", req.body);

    // Validar que se haya seleccionado tipo de pago
    if (!payment_type) {
      return res.status(400).send("El tipo de pago es requerido");
    }

    // Función para parsear fechas en formato DD/MM/YYYY
    const parseDate = (dateString) => {
      const [day, month, year] = dateString.split('/');
      // Crear fecha en formato ISO (YYYY-MM-DD)
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00Z`);
    };

    // Formatear fechas para MySQL
    const checkInDate = parseDate(check_in);
    const checkOutDate = parseDate(check_out);

    const formatUTCForMySQL = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day} 12:00:00`;
    };

    const check_in_formatted = formatUTCForMySQL(checkInDate);
    const check_out_formatted = formatUTCForMySQL(checkOutDate);

    // Obtener el usuario de la sesión
    const usuario_id = req.session.user?.id || 1;

    // IMPORTANTE: Eliminar la reservación ANTES de crear la renta
    // para que no haya conflicto de disponibilidad
    console.log(`🗑️ Eliminando reservación ${id} antes de crear la renta...`);
    await deletebyReservation(id);
    console.log(`✅ Reservación ${id} eliminada`);

    // Crear la renta con los datos de la reservación
    const rentData = {
      room_id: habitacion_id_value,
      user_id: usuario_id,
      client_name,
      email,
      phone,
      check_in_date: check_in_formatted,
      check_out_date: check_out_formatted,
      payment_type,
      amount: price,
      amount_text: price_text,
    };

    console.log("📝 Creando renta con datos:", rentData);
    const rent_id = await createRent(rentData);
    console.log("✅ Renta creada con ID:", rent_id);

    // Obtener el número real de la habitación
    const { getRoomNumberById } = await import("../models/ModelRoom.js");
    const numeroHabitacion = await getRoomNumberById(habitacion_id_value);

    // Preparar datos para el PDF
    const datosParaPDF = {
      client_name,
      email,
      phone,
      check_in: check_in,
      check_out: check_out,
      payment_type,
      price,
      habitacion_id: habitacion_id_value,
      numero_habitacion: numeroHabitacion || habitacion_id_value,
      tipo: "renta",
    };

    console.log("📄 Datos listos para PDF:", datosParaPDF);

    // Generar PDF y QR y enviar
    try {
      const { generateAndSendPDF } = await import("../utils/pdfGenerator.js");
      const { generarQR } = await import("../utils/qrGenerator.js");
      const envioPdfService = await import("../utils/pdfEnvio.js").then(
        (module) => module.default
      );

      // Generar QR
      const qrPath = await generarQR(datosParaPDF, "renta");
      // Generar PDF
      const pdfPath = await generateAndSendPDF(datosParaPDF, "renta", qrPath);

      console.log("✅ Comprobantes generados:");
      console.log("📄 PDF:", pdfPath);
      console.log("🔗 QR:", qrPath);

      // Guardar las rutas de los archivos en la base de datos
      await updateRent(rent_id, {
        pdf_path: pdfPath,
        qr_path: qrPath,
      });
      console.log("✅ Rutas de archivos guardadas en la base de datos");

      // Opciones de envío
      const opcionesEnvio = {
        sendEmail: send_email === "on",
        sendWhatsApp: send_whatsapp === "on",
      };

      // Enviar comprobante
      const resultadosEnvio = await envioPdfService.enviarComprobanteRenta(
        datosParaPDF,
        pdfPath,
        opcionesEnvio
      );

      console.log("📧 Resultados de envío:", resultadosEnvio);

      res.redirect("/rooms/list/rentas");
    } catch (pdfError) {
      console.error("❌ Error al generar/enviar PDF:", pdfError);
      // Aunque falle el PDF, la renta ya se creó
      res.redirect("/rooms/list/rentas");
    }
  } catch (error) {
    console.error("❌ Error al convertir reservación a renta:", error);
    res.status(500).send("Error al convertir la reservación a renta");
  }
};
