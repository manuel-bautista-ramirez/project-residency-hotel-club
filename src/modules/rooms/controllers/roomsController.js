// roomsController.js
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Formato para fechas de MySQL (guardamos en UTC para evitar desfases al recuperar)
const formatUTCForMySQL = (date) => {
  try {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error al formatear fecha para MySQL:", error);
    throw new Error("Error al formatear fecha");
  }
};

// Helper function para manejo seguro de fechas
const formatearFechaSafe = (fecha, formato = 'iso') => {
  if (!fecha) return null;
  try {
    const fechaObj = new Date(fecha);
    // Verificar si la fecha es válida
    if (isNaN(fechaObj.getTime())) {
      console.warn(`Fecha inválida encontrada: ${fecha}`);
      return null;
    }

    switch (formato) {
      case 'date':
        return fechaObj.toISOString().split("T")[0];
      case 'iso_mx': {
        const formatter = new Intl.DateTimeFormat('es-MX', {
          timeZone: 'America/Mexico_City',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        const parts = formatter.formatToParts(fechaObj).reduce((acc, p) => {
          acc[p.type] = p.value; return acc;
        }, {});
        // Devolver en formato ISO con offset fijo de México: YYYY-MM-DDTHH:mm:ss-06:00
        return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-06:00`;
      }
      case 'iso':
      default:
        return fechaObj.toISOString();
    }
  } catch (error) {
    console.warn(`Error al formatear fecha: ${fecha}`, error);
    return null;
  }
};
import { pool } from "../../../dataBase/connectionDataBase.js";
import {
  getHabitaciones,
  findReservacionById,
  findRentaById,
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
  deleteByIdRenta as deleteRentaFromDB,
  updateReservation,
  updateRent,
  finalizarRenta,
  finalizarRentasExpiradas,
  hasActiveBookings, // <-- NUEVO import
  findReservacionByRentId,
} from "../models/ModelRoom.js"; // Ajusta la ruta según tu proyecto

// Para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderHabitacionesView = async (req, res) => {
  try {
    const user = req.session.user || { role: "Usuario" };

    // Actualizar habitaciones de rentas expiradas antes de cargar las habitaciones
    try {
      const resultado = await finalizarRentasExpiradas();
      if (resultado.actualizadas > 0) {
        console.log(`🔄 Se actualizaron automáticamente ${resultado.actualizadas} habitaciones de rentas expiradas a estado limpieza`);
      }
    } catch (error) {
      console.error("⚠️ Error al actualizar habitaciones de rentas expiradas:", error);
      // No interrumpir el flujo, solo registrar el error
    }

    const habitaciones = await getHabitaciones();

    res.render("ShowAllRooms", {
      title: "Habitaciones",
      showFooter: true,
      showNavbar: true,
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
  const { status } = req.body; // "disponible"

  try {
    // 1) Ejecutar finalización automática de rentas expiradas para limpiar el estado del sistema
    try {
      await finalizarRentasExpiradas();
    } catch (err) {
      console.warn("Error al finalizar rentas expiradas antes de cambio de estado:", err);
    }

    // 2) Validar cambio de limpieza --> disponible
    if (status === 'disponible') {
      // Obtener el estado actual de la habitación
      const habitaciones = await getHabitaciones();
      const habitacion = habitaciones.find(h => Number(h.id) === Number(id));
      if (!habitacion) {
        return res.status(404).send("Habitación no encontrada.");
      }

      // Solo permitir si el estado actual es 'limpieza'
      if (habitacion.estado !== 'limpieza') {
        return res.status(400).send("Solo se puede marcar como disponible si la habitación está en limpieza.");
      }


    }

    // 3) Proceder con el cambio de estado
    const success = await updateRoomStatus(id, status);

    if (success) {
      return res.redirect("/rooms");
    } else {
      return res.status(500).send("No se pudo actualizar el estado.");
    }
  } catch (err) {
    console.error("Error en changesStatus:", err);
    return res.status(500).send("Error interno al cambiar el estado");
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
      price,
      monto,
      enganche,
      send_email,
      send_whatsapp,
    } = req.body;

    const usuario_id = req.session.user?.id;
    console.log("Usuario ID from session:", usuario_id);

    if (!usuario_id || Number.isNaN(Number(usuario_id))) {
      return res.status(401).send("Usuario no autenticado o ID inválido");
    }

    // Validar y formatear fechas de forma segura
    if (!fecha_ingreso || !fecha_salida) {
      console.error("Fechas faltantes:", { fecha_ingreso, fecha_salida });
      return res.status(400).send("Las fechas de ingreso y salida son requeridas");
    }

    const fechaIngresoDate = new Date(fecha_ingreso);
    const fechaSalidaDate = new Date(fecha_salida);

    // Validar que las fechas sean válidas
    if (isNaN(fechaIngresoDate.getTime()) || isNaN(fechaSalidaDate.getTime())) {
      console.error("Fechas inválidas:", { fecha_ingreso, fecha_salida });
      return res.status(400).send("Las fechas proporcionadas no son válidas");
    }



    fechaIngresoDate.setHours(12, 0, 0, 0);     // 12:00 PM
    fechaSalidaDate.setHours(11, 59, 0, 0);     // 11:59 AM

    const fecha_ingreso_formatted = formatUTCForMySQL(fechaIngresoDate);
    const fecha_salida_formatted = formatUTCForMySQL(fechaSalidaDate);

    console.log("Fechas formateadas para MySQL:", {
      fecha_ingreso_formatted,
      fecha_salida_formatted
    }
    );

    // El formulario envía "price", pero también aceptar "monto" por compatibilidad
    const montoTotal = Number(price || monto) || 0;
    const monto_letras = convertMumbersWorks(montoTotal);
    const enganche_amount = Number(enganche) || 0;
    const enganche_letras = convertMumbersWorks(enganche_amount);

    console.log("💰 Montos recibidos:", { price, monto, montoTotal, enganche_amount });

    const reservationData = {
      habitacion_id,
      usuario_id: Number(usuario_id),
      nombre_cliente,
      correo,
      telefono,
      fecha_reserva: formatUTCForMySQL(new Date()),
      fecha_ingreso: fecha_ingreso_formatted,
      fecha_salida: fecha_salida_formatted,
      monto: montoTotal,
      monto_letras,
      enganche: enganche_amount,
      enganche_letras,
    };

    console.log("Creando reservación con datos:", reservationData);
    const reservationId = await createReservation(reservationData);

    if (!reservationId) {
      return res.status(500).send("Error al crear la reservación");
    }

    console.log(`Reservación creada con ID: ${reservationId}`);

    try {
      const reservacionCreada = await findReservacionById(reservationId);
      if (reservacionCreada) {
        console.log("🕒 Timestamp almacenado en BD:", {
          fecha_reserva: reservacionCreada.fecha_reserva,
          fecha_ingreso: reservacionCreada.fecha_ingreso,
          fecha_salida: reservacionCreada.fecha_salida,
        });
      } else {
        console.warn("⚠️ No se pudo recuperar la reservación recién creada para depuración");
      }
    } catch (debugError) {
      console.warn("⚠️ Error obteniendo reservación para depuración de fechas:", debugError);
    }

    // Obtener el número real de la habitación
    const { getRoomNumberById } = await import("../models/ModelRoom.js");
    const numeroHabitacion = await getRoomNumberById(habitacion_id);

    // Preparar datos para el PDF
    const datosParaPDF = {
      id: reservationId,
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso,
      fecha_salida,
      monto: montoTotal,
      enganche: enganche_amount,
      habitacion_id,
      numero_habitacion: numeroHabitacion || habitacion_id, // Usar número real o ID como fallback
      tipo: "reservacion",
    };

    console.log("Datos listos para PDF:", datosParaPDF);

    // Generar PDF y QR y enviar
    try {
      // CORREGIDO: Usar los nombres correctos de archivos
      const { generateAndSendPDF } = await import("../utils/pdfGenerator.js");
      const { generarQR } = await import("../utils/qrGenerator.js");
      const pdfEnvioService = await import("../utils/pdfEnvio.js").then(
        (module) => module.default
      );

      // CORREGIDO: Eliminar código duplicado - solo generar QR una vez
      const qrPath = await generarQR(datosParaPDF, 'reservacion');

      // CORREGIDO: Generar PDF con el QR
      const pdfPath = await generateAndSendPDF(datosParaPDF, 'reservacion', qrPath);

      console.log("Comprobantes generados:");
      console.log("PDF:", pdfPath);
      console.log("QR:", qrPath);

      // Guardar las rutas de los archivos en la base de datos
      await updateReservation(reservationId, {
        pdf_path: pdfPath,
        qr_path: qrPath,
      });
      console.log("Rutas de archivos guardadas en la base de datos");

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

      console.log("Resultados del envío:", resultadosEnvio);
    } catch (pdfError) {
      console.error("Error generando/enviando comprobante:", pdfError);
      // No detenemos el flujo principal si falla el PDF
    }

    return res.redirect("/rooms?success=reservacion");
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

    const reservationsArray = Array.isArray(allReservationes) ? allReservationes : [];

    console.log(`Reservaciones obtenidas de BD: ${reservationsArray.length}`);

    // Depuración: mostrar todas las reservaciones con su estado
    reservationsArray.forEach((r, i) => {
      console.log(`Reservación ${i + 1}:`, {
        id: r.id_reservacion,
        es_convertida: r.es_convertida,
        estado_reservacion: r.estado_reservacion,
        numero_habitacion: r.numero_habitacion,
        nombre_cliente: r.nombre_cliente
      });
    });

    const currencyFormatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    });

    const ahora = new Date();

    const reservacionesFormateadas = reservationsArray.map((reservacion) => {
      // Fecha ingreso/salida originales (pueden venir como strings MySQL)
      const fechaIngresoRaw = reservacion.fecha_ingreso;
      const fechaIngresoDate = fechaIngresoRaw ? new Date(fechaIngresoRaw) : null;

      // Fecha de inicio del periodo de confirmación = fecha_ingreso - 30 minutos
      const confirmStartDate = fechaIngresoDate ? new Date(fechaIngresoDate.getTime() - (30 * 60 * 1000)) : null;

      // Enganche perdido si ahora > fecha_ingreso + 30 minutos (es decir: no se confirmó en el lapso)
      const enganchePerdido = fechaIngresoDate ? (ahora > new Date(fechaIngresoDate.getTime() + (30 * 60 * 1000))) : false;

      const esConvertida = reservacion.es_convertida === 1;
      const origenLabel = esConvertida ? "Conversión" : "Reservación";
      const estadoBase = reservacion.estado_reservacion || "pendiente";

      const estadoEtiqueta = esConvertida
        ? { texto: "Convertida a renta", clase: "bg-blue-100 text-blue-800", icono: "fa-solid fa-right-left" }
        : estadoBase === "cancelada"
          ? { texto: "Cancelada", clase: "bg-red-100 text-red-700", icono: "fa-solid fa-ban" }
          : { texto: "Pendiente", clase: "bg-amber-100 text-amber-700", icono: "fa-solid fa-clock" };

      const resumenFinanciero = esConvertida
        ? {
          tipo: reservacion.tipo_pago_renta || reservacion.tipo_pago,
          monto: reservacion.monto_renta || reservacion.precio_total,
          monto_formateado: currencyFormatter.format(
            Number(reservacion.monto_renta || reservacion.precio_total || 0)
          ),
          origen: origenLabel,
          origen_clave: "conversion",
        }
        : {
          tipo: reservacion.tipo_pago,
          monto: reservacion.precio_total,
          monto_formateado: currencyFormatter.format(Number(reservacion.precio_total || 0)),
          origen: origenLabel,
          origen_clave: "reservacion",
        };

      const estado_clave = esConvertida
        ? "convertida"
        : estadoBase === "cancelada"
          ? "cancelada"
          : "pendiente";

      return {
        ...reservacion,
        // Enviar fechas en formato ISO estándar; el frontend las formatea manualmente
        fecha_reserva: formatearFechaSafe(reservacion.fecha_reserva, 'iso'),
        fecha_ingreso: formatearFechaSafe(reservacion.fecha_ingreso, 'iso'),
        fecha_salida: formatearFechaSafe(reservacion.fecha_salida, 'iso'),
        enganche_perdido: Boolean(enganchePerdido),
        confirm_start: confirmStartDate ? confirmStartDate.toISOString() : null, // para data-attribute en la vista
        es_convertida: esConvertida,
        estado_etiqueta: estadoEtiqueta,
        resumen_financiero: resumenFinanciero,
        origen_clave: resumenFinanciero.origen_clave,
        estado_clave,
      };
    });

    // Filtrar solo las reservaciones pendientes (no convertidas)
    const reservacionesPendientes = reservacionesFormateadas.filter(r => !r.es_convertida);
    const reservacionesConvertidas = reservacionesFormateadas.filter(r => r.es_convertida);

    console.log(`Reservaciones pendientes (no convertidas): ${reservacionesPendientes.length}`);
    console.log(`Reservaciones convertidas: ${reservacionesConvertidas.length}`);

    const totalPendiente = reservacionesPendientes.reduce((sum, r) => sum + Number(r.resumen_financiero?.monto || 0), 0);
    const totalConvertido = reservacionesConvertidas.reduce((sum, r) => sum + Number(r.resumen_financiero?.monto || 0), 0);

    const resumenReservaciones = {
      pendientes: {
        cantidad: reservacionesPendientes.length,
        total: currencyFormatter.format(totalPendiente),
      },
      convertidas: {
        cantidad: reservacionesConvertidas.length,
        total: currencyFormatter.format(totalConvertido),
      },
    };

    res.render("showReservations", {
      title: "Administración de Reservaciones",
      showFooter: true,
      // CAMBIO IMPORTANTE: Enviar solo las reservaciones pendientes
      allReservationes: reservacionesPendientes,
      resumenReservaciones,
      user: {
        ...user,
        rol: user.role,
      },
      showNavbar: true,
    });
  } catch (error) {
    console.error(
      "Error al renderizar las reservaciones:",
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

    // Obtener datos de la reservación antes de eliminarla para borrar archivos
    console.log(`Obteniendo datos de la reservación ${reservationId}...`);
    const reservacion = await findReservacionById(reservationId);

    // Eliminar PDF y QR de la reservación si existen
    if (reservacion) {
      const fs = await import("fs");
      const fsPromises = fs.promises;

      if (reservacion.pdf_path) {
        try {
          if (fs.default.existsSync(reservacion.pdf_path)) {
            await fsPromises.unlink(reservacion.pdf_path);
            console.log(` PDF de reservación eliminado: ${reservacion.pdf_path}`);
          }
        } catch (error) {
          console.error(`Error al eliminar PDF de reservación:`, error.message);
        }
      }

      if (reservacion.qr_path) {
        try {
          if (fs.default.existsSync(reservacion.qr_path)) {
            await fsPromises.unlink(reservacion.qr_path);
            console.log(` QR de reservación eliminado: ${reservacion.qr_path}`);
          }
        } catch (error) {
          console.error(`Error al eliminar QR de reservación:`, error.message);
        }
      }
    }

    // Eliminar la reservación de la base de datos
    console.log(` Eliminando reservación ${reservationId} de la base de datos...`);
    const success = await deletebyReservation(reservationId);

    if (success) {
      console.log(`Reservación ${reservationId} eliminada exitosamente`);
      res.redirect("/rooms/list/reservations");
    } else {
      res.status(500).send("No se pudo eliminar la reservación");
    }
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).send("Error al eliminar la reservación");
  }
};

// delete by id renta (eliminación permanente)
export const deleteIdRenta = async (req, res) => {
  try {
    const rentaId = Number(req.params.id);
    if (Number.isNaN(rentaId)) return res.status(400).send("ID inválido");

    // 1. Obtener los datos de la renta ANTES de eliminarla
    console.log(`Obteniendo datos de la renta ${rentaId}...`);
    const renta = await findRentaById(rentaId);

    if (!renta) {
      return res.status(404).send("Renta no encontrada");
    }

    const habitacionId = renta.habitacion_id;

    // 1.1 Obtener reservación asociada (si fue conversión)
    const reservacionAsociada = await findReservacionByRentId(rentaId);

    // Helpers para eliminar archivos compartidos
    let fsModule;
    let fsDefault;
    let fsPromises;

    const ensureFs = async () => {
      if (!fsModule) {
        fsModule = await import("fs");
        fsDefault = fsModule.default;
        fsPromises = fsModule.promises;
      }
    };

    const eliminarArchivo = async (ruta, etiqueta) => {
      if (!ruta) return;
      try {
        await ensureFs();
        if (fsDefault.existsSync(ruta)) {
          await fsPromises.unlink(ruta);
          console.log(`✅ ${etiqueta} eliminado: ${ruta}`);
        }
      } catch (error) {
        console.error(`❌ Error al eliminar ${etiqueta}:`, error.message);
      }
    };

    // 2. Eliminar archivos PDF y QR si existen
    await eliminarArchivo(renta.pdf_path, "PDF de renta");
    await eliminarArchivo(renta.qr_path, "QR de renta");

    // 2.1 Eliminar reservación asociada (si aplica) y sus archivos
    if (reservacionAsociada) {
      console.log(`Eliminando reservación asociada ${reservacionAsociada.id} a la renta ${rentaId}...`);
      await eliminarArchivo(reservacionAsociada.pdf_path, "PDF de reservación convertida");
      await eliminarArchivo(reservacionAsociada.qr_path, "QR de reservación convertida");

      const reservaEliminada = await deletebyReservation(reservacionAsociada.id);
      if (!reservaEliminada) {
        console.error(`No se pudo eliminar la reservación asociada ${reservacionAsociada.id}`);
        return res.status(500).send("No se pudo eliminar la reservación asociada a la renta");
      }
      console.log(`✅ Reservación asociada ${reservacionAsociada.id} eliminada exitosamente`);
    }

    // 3. Liberar la habitación
    console.log(`Liberando habitación ${habitacionId} y poniéndola en estado "disponible"...`);
    const { pool } = await import("../../../dataBase/connectionDataBase.js");
    await pool.query('UPDATE habitaciones SET estado = "disponible" WHERE id = ?', [habitacionId]);

    // 4. Eliminar la renta de la base de datos
    console.log(`Eliminando renta ${rentaId} de la base de datos...`);
    const success = await deleteRentaFromDB(rentaId);

    if (success) {
      console.log(`🎉 Renta ${rentaId} eliminada exitosamente y habitación liberada`);
      res.redirect("/rooms/list/rentas");
    } else {
      res.status(500).send("No se pudo eliminar la renta");
    }
  } catch (err) {
    console.error("Error deleting renta:", err);
    res.status(500).send("Error al eliminar la renta");
  }
};

export const renderAllRentas = async (req, res) => {
  try {
    const user = req.session.user || { role: "Usuario" };
    const allRentas = await getAllRentas();

    const rentasDirectas = allRentas.filter((renta) => renta.es_conversion === 0);
    const rentasConvertidas = allRentas.filter((renta) => renta.es_conversion === 1);

    const calcularTotal = (items) =>
      items.reduce((total, renta) => total + Number(renta.monto || 0), 0);

    const currencyFormatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    });

    const resumenIngresos = {
      directas: {
        total: calcularTotal(rentasDirectas),
        cantidad: rentasDirectas.length,
      },
      convertidas: {
        total: calcularTotal(rentasConvertidas),
        cantidad: rentasConvertidas.length,
      },
    };

    resumenIngresos.directas.total_formateado = currencyFormatter.format(
      resumenIngresos.directas.total
    );
    resumenIngresos.convertidas.total_formateado = currencyFormatter.format(
      resumenIngresos.convertidas.total
    );

    // Formatear fechas sin ajuste de zona horaria de forma segura
    const formatDateForDisplay = (dateStr) => {
      if (!dateStr) return null;
      try {
        // Extraer la fecha y hora directamente del string de MySQL
        // Formato: "2025-10-11T12:00:00.000Z" → "11/10/2025 12:00"
        const date = new Date(dateStr);

        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
          console.warn(`Fecha inválida en renta: ${dateStr}`);
          return "Fecha inválida";
        }

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      } catch (error) {
        console.error(`Error al formatear fecha de renta: ${dateStr}`, error);
        return "Error en fecha";
      }
    };

    const rentasFormateadas = allRentas.map((renta) => ({
      ...renta,
      fecha_ingreso: formatDateForDisplay(renta.fecha_ingreso),
      fecha_salida: formatDateForDisplay(renta.fecha_salida),
      origen_texto:
        renta.es_conversion === 0
          ? "Renta directa"
          : "Conversión de reservación",
      origen_clave: renta.es_conversion === 0 ? "directa" : "conversion",
    }));

    console.log('🔍 Usuario en renderAllRentas:', user);
    console.log('🔍 Rol del usuario:', user.role);
    console.log(rentasFormateadas);
    res.render("showRent", {
      title: "Listado de habitaciones rentadas",
      allRentas: rentasFormateadas,
      resumenIngresos,
      showFooter: true,
      user: {
        ...user,
        rol: user.role,
      },
      showNavbar: true,
    });
  } catch (error) {
    console.error("Error al renderizar las rentas loco:", error.message);
    res.status(500).send("Error al cargar las rentas loco..");
  }
};

// Marcar renta como desocupada (finalizada) y liberar habitación
export const marcarComoDesocupada = async (req, res) => {
  try {
    const rentaId = Number(req.params.id);
    if (Number.isNaN(rentaId)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    console.log(`Verificando si la renta ${rentaId} puede ser desocupada...`);

    // Verificar si la renta ya está expirada
    const [rentaInfo] = await pool.query(`
      SELECT fecha_salida, estado,
             CASE
               WHEN estado = 'finalizada' THEN 'expirada'
               WHEN (
                 DATE(fecha_salida) < CURDATE()
                 OR
                 (DATE(fecha_salida) = CURDATE() AND NOW() >= fecha_salida)
               ) THEN 'expirada'
               ELSE 'corriente'
             END AS estado_tiempo
      FROM rentas
      WHERE id = ?
    `, [rentaId]);

    if (rentaInfo.length === 0) {
      console.error(`❌ Renta ${rentaId} no encontrada`);
      return res.status(404).json({ error: "Renta no encontrada" });
    }

    const renta = rentaInfo[0];

    // Validar que la renta no esté expirada
    if (renta.estado_tiempo === 'expirada') {
      console.log(`⚠️ Intento de desocupar renta expirada ${rentaId}`);
      return res.status(400).json({
        error: "No se puede desocupar una renta que ya ha expirado",
        details: "Esta renta ya venció y no puede ser desocupada manualmente"
      });
    }

    console.log(`✅ Renta ${rentaId} está corriente, procediendo a marcar como desocupada...`);

    // Llamar a la función del modelo que finaliza la renta y libera la habitación
    const success = await finalizarRenta(rentaId);

    if (success) {
      console.log(`✅ Renta ${rentaId} marcada como finalizada y habitación liberada`);
      res.redirect("/rooms/list/rentas");
    } else {
      console.error(`❌ No se pudo finalizar la renta ${rentaId}`);
      res.status(500).json({ error: "No se pudo marcar como desocupada" });
    }
  } catch (err) {
    console.error("Error al marcar renta como desocupada:", err);
    res.status(500).json({ error: "Error al marcar como desocupada la habitación" });
  }
};

export const renderFormEditarReservacion = async (req, res) => {
  try {
    const reservacionId = Number(req.params.id);
    if (Number.isNaN(reservacionId))
      return res.status(400).send("ID de reservación inválido");

    const reservacion = await findReservacionById(reservacionId);
    if (!reservacion) return res.status(404).send("Reservación no encontrada");



    // Formatear fechas para inputs tipo date de forma segura
    reservacion.fecha_ingreso = formatearFechaSafe(reservacion.fecha_ingreso, 'date') || "";
    reservacion.fecha_salida = formatearFechaSafe(reservacion.fecha_salida, 'date') || "";

    console.log("Fcehas recibicidas de la reservaciona editar: ", reservacion.fecha_ingreso, reservacion.fecha_salida)

    const habitaciones = await getHabitaciones();

    return res.render(" editReservation", {
      title: "Editar Reservación",
      showFooter: true,
      reservacion,
      habitaciones,
      user: req.session.user,
      showNavbar: true
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
      fecha_ingreso_with_time,
      fecha_salida_with_time,
      habitacion_id,
      monto,
      monto_letras,
      send_email,
      send_whatsapp,
    } = req.body;

    const fechaIngresoRaw = fecha_ingreso_with_time || fecha_ingreso;
    const fechaSalidaRaw = fecha_salida_with_time || fecha_salida;

    console.log("Fechas recibidas :", {
      fecha_ingreso,
      fecha_ingreso_with_time,
      fecha_salida,
      fecha_salida_with_time,
    });

    console.log(`Editando reservación ${id}...`);
    console.log("Datos recibidos:", req.body);

    // ===============================
    //  CONVERTIR FECHAS A LOCAL (MX)
    // ===============================
    const fechaIngresoDate = new Date(fechaIngresoRaw);
    const fechaSalidaDate = new Date(fechaSalidaRaw);


    fechaIngresoDate.setHours(12, 0, 0, 0);     // 12:00 PM
    fechaSalidaDate.setHours(11, 59, 0, 0);     // 11:59 AM


    if (isNaN(fechaIngresoDate.getTime()) || isNaN(fechaSalidaDate.getTime())) {
      return res.status(400).send("Fechas inválidas");
    }


    //
    const fecha_ingreso_formatted = formatUTCForMySQL(fechaIngresoDate);
    const fecha_salida_formatted = formatUTCForMySQL(fechaSalidaDate);

    // ===================================
    //  DATOS PARA ACTUALIZAR RESERVACIÓN
    // ===================================
    const reservationData = {
      nombre_cliente,
      fecha_ingreso: fecha_ingreso_formatted,
      fecha_salida: fecha_salida_formatted,
      habitacion_id,
      monto,
      monto_letras
    };

    // Obtener datos anteriores para eliminar archivos viejos
    const reservacionAnterior = await findReservacionById(id);

    // Actualizar datos
    await updateReservation(id, reservationData);
    console.log("Reservación actualizada exitosamente");

    // Obtener reservación actualizada
    const reservacionActualizada = await findReservacionById(id);

    // Obtener número real de la habitación
    const { getRoomNumberById } = await import("../models/ModelRoom.js");
    const numeroHabitacion = await getRoomNumberById(habitacion_id);

    // ===================================
    //      DATOS PARA PDF ACTUALIZADO
    // ===================================
    const datosParaPDF = {
      id: id,
      nombre_cliente,
      correo: reservacionActualizada.correo_cliente,
      telefono: reservacionActualizada.telefono_cliente,
      fecha_ingreso: fechaIngresoRaw,
      fecha_salida: fechaSalidaRaw,
      monto,
      habitacion_id,
      numero_habitacion: numeroHabitacion || habitacion_id,
      tipo: "reservacion",
    };

    console.log("Datos listos para PDF actualizado:", datosParaPDF);

    // ===================================
    //       GENERAR PDF Y QR NUEVOS
    // ===================================
    try {
      const fs = await import("fs");
      const { generateAndSendPDF } = await import("../utils/pdfGenerator.js");
      const { generarQR } = await import("../utils/qrGenerator.js");
      const envioPdfService = await import("../utils/pdfEnvio.js").then(m => m.default);

      // ------------------------------
      // ELIMINAR ARCHIVOS ANTERIORES
      // ------------------------------
      try {
        if (reservacionAnterior.pdf_path && fs.existsSync(reservacionAnterior.pdf_path)) {
          fs.unlinkSync(reservacionAnterior.pdf_path);
          console.log("PDF anterior eliminado:", reservacionAnterior.pdf_path);
        }

        if (reservacionAnterior.qr_path && fs.existsSync(reservacionAnterior.qr_path)) {
          fs.unlinkSync(reservacionAnterior.qr_path);
          console.log("QR anterior eliminado:", reservacionAnterior.qr_path);
        }
      } catch (cleanupError) {
        console.warn("Error al eliminar archivos anteriores:", cleanupError);
      }

      // ------------------------------
      // GENERAR NUEVO QR
      // ------------------------------
      const qrPath = await generarQR(datosParaPDF, "reservacion");

      // ------------------------------
      // GENERAR PDF NUEVO
      // ------------------------------
      const pdfPath = await generateAndSendPDF(
        datosParaPDF,
        "reservacion",
        qrPath
      );

      // Guardar nuevas rutas
      await updateReservation(id, {
        pdf_path: pdfPath,
        qr_path: qrPath,
      });

      console.log("PDF y QR actualizados guardados");

      // ------------------------------
      // OPCIONES DE ENVÍO
      // ------------------------------
      const opcionesEnvio = {
        sendEmail: send_email === "on",
        sendWhatsApp: send_whatsapp === "on",
      };

      await envioPdfService.enviarComprobanteReservacion(
        datosParaPDF,
        pdfPath,
        opcionesEnvio
      );

    } catch (pdfError) {
      console.error("Error generando/enviando PDF:", pdfError);
    }

    res.redirect("/rooms/list/reservations");

  } catch (error) {
    console.error("Error al editar reservación:", error);
    res.status(500).send("Error al editar la reservación");
  }
};


export const renderReservacionesView = async (req, res) => {
  const user = req.session.user || { role: "Usuario" };

  try {
    // Verificar que solo administradores puedan acceder
    if (user.role !== "Administrador") {
      return res.status(403).render("error", {
        title: "Acceso Denegado",
        message: "Solo los Administradores tienen permiso para ver los reportes de habitaciones.",
        user,
      });
    }

    // Usar ruta absoluta para evitar conflictos con otros módulos
    res.render(path.join(__dirname, '../views/reports'), {
      title: "reportes",
      showNavbar: true,
      showFooter: true,
      user: {
        ...user,
        rol: user.role,
      },
      showNavbar: true,
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
      showFooter: true,
      habitacion,
      habitaciones,
      user: req.session.user,
      showNavbar: true,
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
      showNavbar: true,
    });
  } catch (err) {
    console.error("Error en renderFormRentar:", err);
    return res.status(500).send("Error al cargar el formulario de renta");
  }
};

export const handleCreateRenta = async (req, res) => {
  try {
    const habitacionId = Number(req.params.id);
    if (Number.isNaN(habitacionId)) {
      return res.status(400).send("ID de habitación inválido");
    }

    const {
      client_name,
      email,
      phone,
      check_in,
      check_out,
      price,
      price_text,
      payment_type,
      send_email,
      send_whatsapp,
    } = req.body;

    const missingFields = [];
    if (!client_name) missingFields.push("nombre del cliente");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("teléfono");
    if (!check_in) missingFields.push("fecha de entrada");
    if (!check_out) missingFields.push("fecha de salida");
    if (!price) missingFields.push("precio");
    if (!payment_type) missingFields.push("tipo de pago");

    if (missingFields.length) {
      return res
        .status(400)
        .send(`Faltan datos obligatorios: ${missingFields.join(", ")}`);
    }

    const tiposPagoValidos = ["tarjeta", "transferencia", "efectivo"];
    if (!tiposPagoValidos.includes(payment_type)) {
      return res.status(400).send("Tipo de pago inválido");
    }

    const usuarioId = req.session.user?.id;
    if (!usuarioId) {
      return res.status(401).send("Usuario no autenticado");
    }

    const messageMethodId = await createMessageMethod(email, phone);

    const montoNumerico = Number(price) || 0;
    const montoTexto = price_text?.trim()
      ? price_text
      : numeroALetras(montoNumerico);

    const rentData = {
      room_id: habitacionId,
      user_id: usuarioId,
      message_method_id: messageMethodId,
      client_name,
      email,
      phone,
      check_in_date: check_in,
      check_out_date: check_out,
      payment_type,
      amount: montoNumerico,
      amount_text: montoTexto,
      enganche: 0,
    };

    const rentId = await createRent(rentData);

    const { getRoomNumberById } = await import("../models/ModelRoom.js");
    const numeroHabitacion = await getRoomNumberById(habitacionId);

    const datosParaPDF = {
      id: rentId,
      client_name,
      email,
      phone,
      check_in,
      check_out,
      payment_type,
      price: montoNumerico.toFixed(2),
      habitacion_id: habitacionId,
      numero_habitacion: numeroHabitacion || habitacionId,
    };

    try {
      const { generateAndSendPDF } = await import("../utils/pdfGenerator.js");
      const { generarQR } = await import("../utils/qrGenerator.js");
      const envioPdfService = await import("../utils/pdfEnvio.js").then(
        (module) => module.default
      );

      const qrPath = await generarQR(datosParaPDF, "renta");
      const pdfPath = await generateAndSendPDF(datosParaPDF, "renta", qrPath);

      await updateRent(rentId, {
        pdf_path: pdfPath,
        qr_path: qrPath,
      });

      const options = {
        sendEmail: send_email === "on",
        sendWhatsApp: send_whatsapp === "on",
      };

      await envioPdfService.enviarComprobanteRenta(
        datosParaPDF,
        pdfPath,
        options
      );
    } catch (pdfError) {
      console.error("Error generando/enviando comprobante de renta:", pdfError);
      // Continuar aunque falle el envío
    }

    return res.redirect("/rooms");
  } catch (error) {
    console.error("Error en handleCreateRenta:", error);
    return res.status(500).send("Error al crear la renta");
  }
};

// Helper para convertir números a letras (simplificado)
function numeroALetras(num) {
  return `${num} pesos`; // Implementa tu lógica si quieres algo más elaborado
}

export const renderCalendario = (req, res) => {
  return res.redirect("/rooms/list/calendario");
};

// Nuevo calendario mejorado con vista por habitación
export const renderCalendarioRooms = async (req, res) => {
  try {
    const user = req.session.user || { role: "Usuario" };

    const [allRentas, allReservaciones] = await Promise.all([
      getAllRentas(),
      getAllReservationes()
    ]);

    // ===== Datos estilo showRent =====
    const rentasDirectas = allRentas.filter((r) => Number(r.es_conversion) === 0);
    const rentasConvertidas = allRentas.filter((r) => Number(r.es_conversion) === 1);

    const calcularTotal = (items) =>
      items.reduce((total, renta) => total + Number(renta.monto || 0), 0);

    const currencyFormatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    });

    const formatDateForDisplay = (dateStr) => {
      if (!dateStr) return null;
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Fecha inválida";
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      } catch (error) {
        console.error(`Error al formatear fecha de renta: ${dateStr}`, error);
        return "Error en fecha";
      }
    };

    const rentasFormateadas = allRentas.map((renta) => ({
      ...renta,
      fecha_ingreso: formatDateForDisplay(renta.fecha_ingreso),
      fecha_salida: formatDateForDisplay(renta.fecha_salida),
      origen_texto: renta.es_conversion === 0 ? "Renta directa" : "Conversión de reservación",
      origen_clave: renta.es_conversion === 0 ? "directa" : "conversion",
    }));

    const resumenIngresos = {
      directas: {
        cantidad: rentasDirectas.length,
        total: calcularTotal(rentasDirectas),
      },
      convertidas: {
        cantidad: rentasConvertidas.length,
        total: calcularTotal(rentasConvertidas),
      },
    };

    resumenIngresos.directas.total_formateado = currencyFormatter.format(resumenIngresos.directas.total);
    resumenIngresos.convertidas.total_formateado = currencyFormatter.format(resumenIngresos.convertidas.total);

    // ===== Datos estilo showReservations =====
    const ahora = new Date();
    const reservacionesFormateadas = allReservaciones.map((reservacion) => {
      const fechaIngresoRaw = reservacion.fecha_ingreso;
      const fechaIngresoDate = fechaIngresoRaw ? new Date(fechaIngresoRaw) : null;
      const confirmStartDate = fechaIngresoDate ? new Date(fechaIngresoDate.getTime() - (30 * 60 * 1000)) : null;

      const esConvertida = reservacion.es_convertida === 1;
      const estadoBase = reservacion.estado_reservacion || "pendiente";
      const estadoEtiqueta = esConvertida
        ? { texto: "Convertida a renta", clase: "bg-blue-100 text-blue-800", icono: "fa-solid fa-right-left" }
        : estadoBase === "cancelada"
          ? { texto: "Cancelada", clase: "bg-red-100 text-red-700", icono: "fa-solid fa-ban" }
          : { texto: "Pendiente", clase: "bg-amber-100 text-amber-700", icono: "fa-solid fa-clock" };

      const resumenFinanciero = esConvertida
        ? {
          tipo: reservacion.tipo_pago_renta || reservacion.tipo_pago,
          monto: reservacion.monto_renta || reservacion.precio_total,
          monto_formateado: currencyFormatter.format(Number(reservacion.monto_renta || reservacion.precio_total || 0)),
          origen: "Conversión",
          origen_clave: "conversion",
        }
        : {
          tipo: reservacion.tipo_pago,
          monto: reservacion.precio_total,
          monto_formateado: currencyFormatter.format(Number(reservacion.precio_total || 0)),
          origen: "Reservación",
          origen_clave: "reservacion",
        };

      const enganchePerdido = fechaIngresoDate ? (ahora > new Date(fechaIngresoDate.getTime() + (30 * 60 * 1000))) : false;

      return {
        ...reservacion,
        fecha_reserva: formatearFechaSafe(reservacion.fecha_reserva, 'iso'),
        fecha_ingreso: formatearFechaSafe(reservacion.fecha_ingreso, 'iso'),
        fecha_salida: formatearFechaSafe(reservacion.fecha_salida, 'iso'),
        enganche_perdido: Boolean(enganchePerdido),
        confirm_start: confirmStartDate ? confirmStartDate.toISOString() : null,
        es_convertida: esConvertida,
        estado_etiqueta: estadoEtiqueta,
        resumen_financiero: resumenFinanciero,
        origen_clave: resumenFinanciero.origen_clave,
        estado_clave: esConvertida
          ? "convertida"
          : estadoBase === "cancelada"
            ? "cancelada"
            : "pendiente",
      };
    });

    const reservacionesPendientes = reservacionesFormateadas.filter(r => !r.es_convertida);
    const reservacionesConvertidas = reservacionesFormateadas.filter(r => r.es_convertida);
    const totalPendiente = reservacionesPendientes.reduce((sum, r) => sum + Number(r.resumen_financiero?.monto || 0), 0);
    const totalConvertido = reservacionesConvertidas.reduce((sum, r) => sum + Number(r.resumen_financiero?.monto || 0), 0);

    const resumenReservaciones = {
      pendientes: {
        cantidad: reservacionesPendientes.length,
        total: currencyFormatter.format(totalPendiente),
      },
      convertidas: {
        cantidad: reservacionesConvertidas.length,
        total: currencyFormatter.format(totalConvertido),
      },
    };

    res.render("calendar", {
      title: "Calendario de Habitaciones",
      showFooter: true,
      showNavbar: true,
      user: {
        ...user,
        rol: user.role,
      },
      allRentas: rentasFormateadas,
      resumenIngresos,
      allReservationes: reservacionesFormateadas,
      resumenReservaciones,
      reservacionesPendientes
    });
  } catch (error) {
    console.error("Error al renderizar calendario con datos:", error);
    res.status(500).send("Error al cargar el calendario");
  }
};

// API para obtener datos del calendario
export const getCalendarData = async (req, res) => {
  try {
    const { getRoomsCalendarData } = await import("../models/ModelRoom.js");

    // Obtener datos del modelo
    const roomsWithBookings = await getRoomsCalendarData();

    console.log(`Habitaciones con datos preparadas: ${roomsWithBookings.length}`);

    res.json({ rooms: roomsWithBookings });
  } catch (error) {
    console.error("Error obteniendo datos del calendario:", error);
    res.status(500).json({ error: "Error al obtener datos del calendario" });
  }
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

// API para obtener eventos en formato FullCalendar (solo próximos)
export const getCalendarEvents = async (req, res) => {
  try {
    const { getAllRentas, getAllReservationes } = await import("../models/ModelRoom.js");

    // Obtener rentas y reservaciones
    const todasLasRentas = await getAllRentas();
    const todasLasReservaciones = await getAllReservationes();

    // Filtrar eventos relevantes para el calendario
    const ahora = new Date();

    // Para rentas: incluir las que están activas (no finalizadas) o que empezarán en el futuro
    // Para rentas: incluir solo las que están activas (corrientes)
    const rentas = todasLasRentas.filter(renta => renta.estado_tiempo === 'corriente');

    // Para reservaciones: incluir las que empezarán en el futuro
    const reservaciones = todasLasReservaciones.filter(reservacion => {
      const fechaIngreso = new Date(reservacion.fecha_ingreso);
      const esConvertida = Number(reservacion.es_convertida) === 1;
      return !esConvertida && fechaIngreso >= ahora;
    });

    console.log(`📊 Total rentas en BD: ${todasLasRentas.length}, Próximas: ${rentas.length}`);
    console.log(`📊 Total reservaciones en BD: ${todasLasReservaciones.length}, Próximas: ${reservaciones.length}`);

    // Convertir rentas a formato FullCalendar
    const eventosRentas = rentas.map(renta => {
      const esConversion = Number(renta.es_conversion) === 1;
      const origenTexto = esConversion ? 'Conversión de reservación' : 'Renta directa';
      const title = `${renta.nombre_cliente} - Hab. ${renta.numero_habitacion}`;

      return {
        id: `renta-${renta.id_renta}`,
        title,
        start: renta.fecha_ingreso,
        end: renta.fecha_salida,
        backgroundColor: esConversion ? '#f59e0b' : '#10b981',
        borderColor: esConversion ? '#d97706' : '#059669',
        extendedProps: {
          tipo: 'renta',
          origen: esConversion ? 'conversion' : 'directa',
          estado: renta.estado_tiempo || 'corriente',
          correo: renta.correo || '',
          telefono: renta.telefono || '',
          habitacion: renta.numero_habitacion,
          precio: renta.monto,
          origenTexto
        }
      };
    });

    // Convertir reservaciones a formato FullCalendar
    const eventosReservaciones = reservaciones.map(reservacion => ({
      id: `reservacion-${reservacion.id_reservacion}`,
      title: `${reservacion.nombre_cliente} - Hab. ${reservacion.numero_habitacion}`,
      start: reservacion.fecha_ingreso,
      end: reservacion.fecha_salida,
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      extendedProps: {
        tipo: 'reservacion',
        correo: reservacion.correo || '',
        telefono: reservacion.telefono || '',
        habitacion: reservacion.numero_habitacion,
        precio: reservacion.precio_total
      }
    }));

    // Combinar todos los eventos
    const todosLosEventos = [...eventosRentas, ...eventosReservaciones];

    console.log(`📅 Total eventos para calendario: ${todosLosEventos.length}`);

    res.json(todosLosEventos);
  } catch (error) {
    console.error("❌ Error obteniendo eventos del calendario:", error);
    res.status(500).json({ error: "Error al obtener eventos del calendario" });
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
      showNavbar: true,
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
}

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
      showNavbar: true,
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

    // Validar fechas
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Las fechas de inicio y fin son requeridas"
      });
    }

    const filtros = {};
    if (habitacion) filtros.habitacion = habitacion;
    if (cliente) filtros.cliente = cliente;
    if (tipoPago) filtros.tipoPago = tipoPago;

    const { getReporteRentas, getReporteReservaciones, getReporteConsolidado } =
      await import("../models/ModelRoom.js");

    let reporte;

    switch (tipo) {
      case "rentas":
        reporte = await getReporteRentas(fechaInicio, fechaFin, filtros);
        break;
      case "reservaciones":
        reporte = await getReporteReservaciones(fechaInicio, fechaFin, filtros);
        break;
      case "consolidado":
        reporte = await getReporteConsolidado(fechaInicio, fechaFin, filtros);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Tipo de reporte no válido. Opciones: rentas, reservaciones, consolidado"
        });
    }

    console.log(`Reporte generado: ${tipo} (${fechaInicio} a ${fechaFin})`);

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
 * Función auxiliar para generar datos del reporte
 */
async function generateReportData(tipo, fechaInicio, fechaFin, filtros = {}) {
  const {
    getReporteRentas,
    getReporteReservaciones,
  } = await import("../models/ModelRoom.js");

  if (tipo === "rentas") {
    // getReporteRentas ya devuelve el objeto completo con datos y estadisticas
    const reporte = await getReporteRentas(fechaInicio, fechaFin, filtros);
    return reporte;
  } else if (tipo === "reservaciones") {
    // getReporteReservaciones ya devuelve el objeto completo con datos y estadisticas
    const reporte = await getReporteReservaciones(fechaInicio, fechaFin, filtros);
    return reporte;
  } else if (tipo === "consolidado") {
    const rentasReporte = await getReporteRentas(fechaInicio, fechaFin, filtros);
    const reservacionesReporte = await getReporteReservaciones(fechaInicio, fechaFin, filtros);

    return {
      tipo: "consolidado",
      fechaInicio,
      fechaFin,
      rentas: {
        datos: rentasReporte.datos || [],
        estadisticas: rentasReporte.estadisticas || {},
      },
      reservaciones: {
        datos: reservacionesReporte.datos || [],
        estadisticas: reservacionesReporte.estadisticas || {},
      },
      estadisticas: {
        totalOperaciones: (rentasReporte.datos?.length || 0) + (reservacionesReporte.datos?.length || 0),
        ingresosReales: rentasReporte.estadisticas?.totalIngresos || 0,
        ingresosEsperados: reservacionesReporte.estadisticas?.totalMontoEsperado || 0,
        totalGeneral: (rentasReporte.estadisticas?.totalIngresos || 0) + (reservacionesReporte.estadisticas?.totalMontoEsperado || 0),
      },
    };
  }

  // Fallback
  return {
    tipo,
    fechaInicio,
    fechaFin,
    datos: [],
    estadisticas: {},
  };
}

/**
 * Función auxiliar para formatear el mensaje del reporte
 */
function formatReportMessage(reporte) {
  const formatCurrency = (value) => `$${parseFloat(value).toFixed(2)} MXN`;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('es-MX');

  let mensaje = `📊 *REPORTE DE ${reporte.tipo.toUpperCase()}*\n`;
  mensaje += `📅 Período: ${formatDate(reporte.fechaInicio)} - ${formatDate(reporte.fechaFin)}\n`;
  mensaje += `🕐 Generado: ${new Date().toLocaleString('es-MX')}\n\n`;

  if (reporte.tipo === 'rentas') {
    mensaje += `📈 *ESTADÍSTICAS*\n`;
    mensaje += `• Total Rentas: ${reporte.estadisticas.totalRentas}\n`;
    mensaje += `• Ingreso Total: ${formatCurrency(reporte.estadisticas.totalIngresos)}\n`;
    mensaje += `• Promedio: ${formatCurrency(reporte.estadisticas.promedioIngreso)}\n\n`;

    if (reporte.datos.length > 0) {
      mensaje += `*DETALLE DE RENTAS*\n`;
      reporte.datos.forEach((r, i) => {
        mensaje += `\n${i + 1}. ${r.nombre_cliente}\n`;
        mensaje += `   Hab: ${r.numero_habitacion} (${r.tipo_habitacion})\n`;
        mensaje += `   Check-in: ${formatDate(r.fecha_ingreso)}\n`;
        mensaje += `   Check-out: ${formatDate(r.fecha_salida)}\n`;
        mensaje += `   Pago: ${r.tipo_pago} - ${formatCurrency(r.monto)}\n`;
      });
    }
  } else if (reporte.tipo === 'reservaciones') {
    mensaje += `📈 *ESTADÍSTICAS*\n`;
    mensaje += `• Total Reservaciones: ${reporte.estadisticas.totalReservaciones}\n`;
    mensaje += `• Monto Esperado: ${formatCurrency(reporte.estadisticas.totalMontoEsperado)}\n`;
    mensaje += `• Enganche Recibido: ${formatCurrency(reporte.estadisticas.totalEnganche)}\n`;
    mensaje += `• Pendiente: ${formatCurrency(reporte.estadisticas.pendientePorCobrar)}\n\n`;

    if (reporte.datos.length > 0) {
      mensaje += `*DETALLE DE RESERVACIONES*\n`;
      reporte.datos.forEach((r, i) => {
        mensaje += `\n${i + 1}. ${r.nombre_cliente}\n`;
        mensaje += `   Hab: ${r.numero_habitacion} (${r.tipo_habitacion})\n`;
        mensaje += `   Fechas: ${formatDate(r.fecha_ingreso)} - ${formatDate(r.fecha_salida)}\n`;
        mensaje += `   Monto: ${formatCurrency(r.monto)}\n`;
        mensaje += `   Enganche: ${formatCurrency(r.enganche || 0)}\n`;
        mensaje += `   Pendiente: ${formatCurrency(r.monto - (r.enganche || 0))}\n`;
      });
    }
  } else if (reporte.tipo === 'consolidado') {
    mensaje += `📈 *ESTADÍSTICAS GENERALES*\n`;
    mensaje += `• Total Operaciones: ${reporte.estadisticas.totalOperaciones}\n`;
    mensaje += `• Ingresos Reales: ${formatCurrency(reporte.estadisticas.ingresosReales)}\n`;
    mensaje += `• Ingresos Esperados: ${formatCurrency(reporte.estadisticas.ingresosEsperados)}\n`;
    mensaje += `• Total General: ${formatCurrency(reporte.estadisticas.totalGeneral)}\n\n`;

    mensaje += `🏨 *RENTAS (${reporte.rentas.estadisticas.totalRentas})*\n`;
    mensaje += `• Ingresos: ${formatCurrency(reporte.rentas.estadisticas.totalIngresos)}\n`;
    mensaje += `• Promedio: ${formatCurrency(reporte.rentas.estadisticas.promedioIngreso)}\n\n`;

    mensaje += `📅 *RESERVACIONES (${reporte.reservaciones.estadisticas.totalReservaciones})*\n`;
    mensaje += `• Monto Esperado: ${formatCurrency(reporte.reservaciones.estadisticas.totalMontoEsperado)}\n`;
    mensaje += `• Enganche: ${formatCurrency(reporte.reservaciones.estadisticas.totalEnganche)}\n`;
    mensaje += `• Pendiente: ${formatCurrency(reporte.reservaciones.estadisticas.pendientePorCobrar)}\n`;
  }

  mensaje += `\n---\n Hotel Residencial Club`;

  return mensaje;
}

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
      email,
      asunto,
      filtros = {},
    } = req.body;

    const targetEmail = destinatario || email;

    if (!targetEmail) {
      return res.status(400).json({ success: false, error: "El correo del destinatario es requerido" });
    }

    // Generar el reporte usando la función existente
    const reporteData = await generateReportData(tipo, fechaInicio, fechaFin, filtros);

    // Crear mensaje de texto del reporte
    const mensaje = formatReportMessage(reporteData);

    // Generar PDF del reporte
    const { generateReportPDF } = await import("../utils/reportPdfGenerator.js");
    const pdfPath = await generateReportPDF(reporteData);

    // Importar servicio de email dinámicamente
    const emailService = (await import("../../../services/emailService.js")).default;
    if (!emailService.isReady()) {
      throw new Error('Servicio de correo no configurado');
    }

    // Enviar por correo con PDF adjunto
    await emailService.send({
      to: targetEmail,
      subject: asunto || `Reporte de ${tipo} - Hotel Club`,
      text: mensaje,
      html: `<pre style="font-family: monospace; white-space: pre-wrap;">${mensaje}</pre>`,
      attachments: [
        {
          filename: `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: fs.readFileSync(pdfPath),
        },
      ],
    });

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

    // Generar el reporte usando la función existente
    const reporteData = await generateReportData(tipo, fechaInicio, fechaFin, filtros);

    // Crear mensaje de texto del reporte
    const mensaje = formatReportMessage(reporteData);

    // Generar PDF del reporte
    const { generateReportPDF } = await import("../utils/reportPdfGenerator.js");
    const pdfPath = await generateReportPDF(reporteData);

    // Importar servicio de WhatsApp dinámicamente
    const whatsappService = (await import("../../../services/whatsappService.js")).default;

    if (!whatsappService.isConnected || !whatsappService.socket) {
      throw new Error('WhatsApp no está conectado');
    }

    // Formatear número de teléfono
    const jid = whatsappService.formatPhoneNumber(telefono);

    // Enviar por WhatsApp con PDF
    if (!fs.existsSync(pdfPath)) {
      throw new Error('No se pudo generar el archivo PDF para el reporte');
    }

    // Enviar mensaje de texto
    await whatsappService.socket.sendMessage(jid, { text: mensaje });

    // Enviar PDF
    await whatsappService.socket.sendMessage(jid, {
      document: fs.readFileSync(pdfPath),
      mimetype: 'application/pdf',
      fileName: `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`,
      caption: `Reporte de ${tipo} - Hotel Club`
    });

    res.json({
      success: true,
      message: "Reporte y PDF enviados por WhatsApp exitosamente",
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

    const reservacion = await findReservacionById(id);
    if (!reservacion) {
      return res.status(404).send("Reservación no encontrada");
    }

    // Formatear fechas al formato DD/MM/YYYY
    const formatearFecha = (fecha) => {
      const date = new Date(fecha);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const anio = date.getFullYear();
      return `${dia}/${mes}/${anio}`;
    };

    // Calcular saldo pendiente
    const montoTotal = Number(reservacion.monto) || 0;
    const enganche = Number(reservacion.enganche) || 0;
    const saldoPendiente = montoTotal - enganche;
    const saldoPendienteLetras = convertMumbersWorks(saldoPendiente);

    // Preparar datos formateados para la vista
    const reservacionFormateada = {
      ...reservacion,
      id_reservacion: reservacion.id,
      correo: reservacion.correo_cliente,
      telefono: reservacion.telefono_cliente,
      fecha_ingreso: formatearFecha(reservacion.fecha_ingreso),
      fecha_salida: formatearFecha(reservacion.fecha_salida),
      enganche: enganche.toFixed(2),
      saldo_pendiente: saldoPendiente.toFixed(2),
      saldo_pendiente_letras: saldoPendienteLetras,
    };

    console.log("Reservación formateada:", reservacionFormateada);
    console.log("Desglose de pago:", {
      montoTotal,
      enganche,
      saldoPendiente
    });

    res.render("convertReservationToRent", {
      title: `Convertir Reservación #${id} a Renta`,
      showFooter: true,
      reservacion: reservacionFormateada,
      user: {
        ...user,
        rol: user.role,
      },
      showNavbar: true,
    });
  } catch (error) {
    console.error("Error al cargar formulario de conversión:", error);
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
      enganche, // Capturar el enganche de la reservación
    } = req.body;

    console.log(`Convirtiendo reservación ${id} a renta...`);
    console.log("Datos recibidos:", req.body);
    console.log("Enganche recibido:", enganche);

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

    const formatUTCForMySQL = (date, isCheckOut = false) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      // Check-in: 12:00:00, Check-out: 11:59:00
      const time = isCheckOut ? '11:59:00' : '12:00:00';
      return `${year}-${month}-${day} ${time}`;
    };

    const check_in_formatted = formatUTCForMySQL(checkInDate, false);
    const check_out_formatted = formatUTCForMySQL(checkOutDate, true);

    // Obtener el usuario de la sesión
    const usuario_id = req.session.user?.id || 1;

    // VALIDACIÓN: Verificar que la habitación NO esté en limpieza
    console.log(`🔍 Verificando estado de la habitación ${habitacion_id_value}...`);
    const habitaciones = await getHabitaciones();
    const habitacion = habitaciones.find(h => Number(h.id) === Number(habitacion_id_value));

    if (!habitacion) {
      return res.status(404).send("Habitación no encontrada");
    }

    // Si la habitación está en limpieza, bloquear la conversión
    if (habitacion.estado === 'limpieza') {
      console.log(`⚠️ Intento de conversión bloqueado: habitación ${habitacion_id_value} está en limpieza`);
      return res.status(400).send("No se puede convertir la reservación a renta: la habitación está en limpieza. Por favor, marque la habitación como disponible primero.");
    }

    // Validar que la habitación esté disponible
    if (habitacion.estado !== 'disponible') {
      console.log(`⚠️ Intento de conversión bloqueado: habitación ${habitacion_id_value} está en estado ${habitacion.estado}`);
      return res.status(400).send(`No se puede convertir la reservación a renta: la habitación está en estado "${habitacion.estado}". Debe estar disponible.`);
    }

    console.log(`✅ Habitación ${habitacion_id_value} está disponible, procediendo con la conversión...`);

    // IMPORTANTE: Obtener datos de la reservación para eliminar archivos
    console.log(`Obteniendo datos de la reservación ${id}...`);
    const reservacion = await findReservacionById(id);

    // Eliminar PDF y QR de la reservación si existen
    if (reservacion) {
      const fs = await import("fs");
      const fsPromises = fs.promises;

      if (reservacion.pdf_path) {
        try {
          if (fs.default.existsSync(reservacion.pdf_path)) {
            await fsPromises.unlink(reservacion.pdf_path);
            console.log(`PDF de reservación eliminado: ${reservacion.pdf_path}`);
          }
        } catch (error) {
          console.error(` Error al eliminar PDF de reservación:`, error.message);
        }
      }

      if (reservacion.qr_path) {
        try {
          if (fs.default.existsSync(reservacion.qr_path)) {
            await fsPromises.unlink(reservacion.qr_path);
            console.log(`QR de reservación eliminado: ${reservacion.qr_path}`);
          }
        } catch (error) {
          console.error(`Error al eliminar QR de reservación:`, error.message);
        }
      }
    }

    // Crear el registro de medios de mensaje primero
    console.log("Creando registro de medios de mensaje...");
    const messageMethodId = await createMessageMethod(email, phone);
    console.log("Medio de mensaje creado con ID:", messageMethodId);

    // Crear la renta con los datos de la reservación
    const rentData = {
      room_id: habitacion_id_value,
      user_id: usuario_id,
      message_method_id: messageMethodId,
      client_name,
      email,
      phone,
      check_in_date: check_in_formatted,
      check_out_date: check_out_formatted,
      payment_type,
      amount: price,
      amount_text: price_text,
      enganche: enganche || 0, // Agregar el enganche
    };

    console.log("Creando renta con datos:", rentData);
    const rent_id = await createRent(rentData, id); // Pasar el ID de la reservación a excluir
    console.log("Renta creada con ID:", rent_id);

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
      enganche: enganche || 0 // Agregar el enganche al PDF
    };

    console.log("Datos listos para PDF:", datosParaPDF);

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

      console.log("Comprobantes generados:");
      console.log("PDF:", pdfPath);
      console.log("QR:", qrPath);

      // Guardar las rutas de los archivos en la base de datos
      await updateRent(rent_id, {
        pdf_path: pdfPath,
        qr_path: qrPath,
      });
      console.log("Rutas de archivos guardadas en la base de datos");

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

      console.log("Resultados de envío:", resultadosEnvio);

      // Redirigir a la página principal de rooms
      res.redirect("/rooms");
    } catch (pdfError) {
      console.error("Error al generar/enviar PDF:", pdfError);
      // Aunque falle el PDF, la renta ya se creó
      res.redirect("/rooms");
    }
  } catch (error) {
    console.error("Error al convertir reservación a renta:", error);
    res.status(500).send("Error al convertir la reservación a renta");
  }
};

// Endpoint para actualizar habitaciones de rentas expiradas
export const finalizarRentasExpiradasController = async (req, res) => {
  try {
    console.log('🔄 Ejecutando actualización manual de habitaciones de rentas expiradas...');
    const resultado = await finalizarRentasExpiradas();

    res.json({
      success: true,
      message: `Se actualizaron ${resultado.actualizadas} habitaciones de rentas expiradas a estado limpieza`,
      data: {
        actualizadas: resultado.actualizadas,
        habitaciones: resultado.habitaciones
      }
    });
  } catch (error) {
    console.error('❌ Error en finalizarRentasExpiradasController:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar habitaciones de rentas expiradas',
      details: error.message
    });
  }
};
