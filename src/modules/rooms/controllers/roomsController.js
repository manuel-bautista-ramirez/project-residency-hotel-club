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
  getRoomNumberById
} from "../models/ModelRoom.js"; // Ajusta la ruta según tu proyecto

import { ReportService } from "../utils/reportService.js";
import emailService from "../../../services/emailService.js";
import jobQueueService from '../../../services/jobQueueService.js';
// Importar el servicio centralizado de WhatsApp
import whatsappService from '../../../services/whatsappService.js';
import { generateAndSendRentPDF, generateAndSendReservationPDF } from '../utils/pdfService.js';
import pdfRegistry from '../models/pdfRegistry.js';

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

    // 4. Convertir fechas para que se guarden correctamente con hora 12:00 local
    const fechaIngresoDate = new Date(fecha_ingreso);
    const fechaSalidaDate = new Date(fecha_salida);

    // Ajustar a 18:00 UTC para que al leer sea 12:00 local (GMT-6)
    fechaIngresoDate.setUTCHours(18, 0, 0, 0);
    fechaSalidaDate.setUTCHours(18, 0, 0, 0);

    // Formatear manualmente usando valores UTC para evitar cualquier conversión del driver
    const formatUTCForMySQL = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const fecha_ingreso_formatted = formatUTCForMySQL(fechaIngresoDate);
    const fecha_salida_formatted = formatUTCForMySQL(fechaSalidaDate);

    // 5. Convertir el monto a letras
    const monto_letras = convertMumbersWorks(Number(monto) || 0);

    // 6. Construir el objeto de datos de la reservación
    const reservationData = {
      habitacion_id,
      usuario_id: Number(usuario_id), // Asegura que sea numérico
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso: fecha_ingreso_formatted,
      fecha_salida: fecha_salida_formatted,
      monto: Number(monto) || 0,
      monto_letras,
    };

    // 6. Crear la reservación en la base de datos
    const result = await createReservation(reservationData);

    // 7. Envío automático de comprobante por WhatsApp después de crear la reservación
    if (result) {
      try {
        console.log("🔍 Datos recibidos para reservación:");
        console.log("- nombre_cliente:", nombre_cliente);
        console.log("- correo:", correo);
        console.log("- telefono:", telefono);
        console.log("- habitacion_id:", habitacion_id);
        console.log("- result:", result);

        // Obtener todas las reservaciones para encontrar la recién creada
        const reservaciones = await getAllReservationes();
        console.log("📋 Total de reservaciones encontradas:", reservaciones.length);

        // Buscar la reservación más reciente que coincida con los datos
        console.log("🔍 Buscando reservación con criterios:");
        console.log("  - nombre_cliente:", nombre_cliente);
        console.log("  - correo:", correo);
        console.log("  - telefono:", telefono);
        console.log("  - habitacion_id:", habitacion_id);

        const reservacionCreada = reservaciones
          .filter(r => {
            console.log(`🔍 Comparando reservación ID ${r.id_reservacion}:`);
            console.log(`  - r.nombre_cliente: "${r.nombre_cliente}" vs "${nombre_cliente}" = ${r.nombre_cliente === nombre_cliente}`);
            console.log(`  - r.correo: "${r.correo}" vs "${correo}" = ${r.correo === correo}`);
            console.log(`  - r.telefono: "${r.telefono}" vs "${telefono}" = ${r.telefono === telefono}`);
            console.log(`  - r.habitacion_id: ${r.habitacion_id} vs ${habitacion_id} = ${r.habitacion_id == habitacion_id}`);

            return r.nombre_cliente === nombre_cliente &&
                   r.correo === correo &&
                   r.telefono === telefono &&
                   r.habitacion_id == habitacion_id;
          })
          .sort((a, b) => new Date(b.fecha_creacion || b.id_reservacion) - new Date(a.fecha_creacion || a.id_reservacion))[0];

        console.log("🔍 Reservación encontrada:", reservacionCreada ? "SÍ" : "NO");
        if (reservacionCreada) {
          console.log("📄 ID de reservación:", reservacionCreada.id_reservacion);
          console.log("📄 Datos completos de la reservación:", JSON.stringify(reservacionCreada, null, 2));
        } else {
          console.log("❌ No se encontró reservación. Reservaciones disponibles:");
          reservaciones.slice(-3).forEach((r, i) => {
            console.log(`  ${i + 1}. ID: ${r.id_reservacion}, Cliente: "${r.nombre_cliente}", Correo: "${r.correo}", Teléfono: "${r.telefono}", Habitación: ${r.habitacion_id}`);
          });
        }
        console.log("📞 Teléfono proporcionado:", telefono ? "SÍ" : "NO");

        if (reservacionCreada && telefono) {
          console.log("📱 Enviando comprobante de reservación automáticamente por WhatsApp...");

          // Obtener datos de la habitación para el número
          const habitaciones = await getHabitaciones();
          const habitacion = habitaciones.find(h => h.id === reservacionCreada.habitacion_id);
          const numeroHabitacion = habitacion ? habitacion.numero : reservacionCreada.habitacion_id;

          // Centralizado: generar y enviar PDF de reservación
          console.log('🔄 Generando y enviando PDF (centralizado) de reservación...');
          const reservationSend = await generateAndSendReservationPDF({
            telefono,
            reservacion: {
              id_reservacion: reservacionCreada.id_reservacion,
              nombre_cliente: reservacionCreada.nombre_cliente,
              telefono,
              habitacion_id: reservacionCreada.habitacion_id,
              fecha_ingreso: reservacionCreada.fecha_ingreso,
              fecha_salida: reservacionCreada.fecha_salida,
              precio_total: reservacionCreada.precio_total,
              tipo_pago: reservacionCreada.tipo_pago,
              fecha_reserva: reservacionCreada.fecha_reserva
            }
          });

          const whatsappResult = reservationSend.success
            ? { success: true, mode: 'pdf' , message: reservationSend.fileName }
            : { success: false, message: reservationSend.error };

          if (whatsappResult.success) {
            console.log(`✅ Comprobante de reservación enviado por WhatsApp (${whatsappResult.mode}):`, whatsappResult.message);
          } else {
            console.log(`⚠️ Error en envío de WhatsApp:`, whatsappResult.message);
          }
        } else {
          console.log("⚠️ No se pudo enviar el comprobante automáticamente:");
          console.log("  - Reservación encontrada:", reservacionCreada ? "SÍ" : "NO");
          console.log("  - Teléfono proporcionado:", telefono ? "SÍ" : "NO");

          if (!reservacionCreada) {
            console.log("🔍 Reservaciones disponibles para comparar:");
            reservaciones.slice(-3).forEach((r, i) => {
              console.log(`  ${i + 1}. ID: ${r.id_reservacion}, Cliente: ${r.nombre_cliente}, Correo: ${r.correo}, Teléfono: ${r.telefono}, Habitación: ${r.habitacion_id}`);
            });
          }
        }
      } catch (sendError) {
        console.error("❌ Error en el envío automático de comprobante de reservación por WhatsApp:", sendError);
        // No interrumpir el flujo principal, solo registrar el error
      }

      return res.redirect("/rooms");
    } else {
      return res.status(500).send("Error al crear la reservación...");
    }
  } catch (err) {
    console.error("Error handleCreateReservation:", err);

    // Verificar si el error es por disponibilidad
    if (err.message && err.message.includes('no está disponible')) {
      return res.status(409).send(`<script>alert('${err.message}'); window.location.href='/rooms';</script>`);
    }

    return res.status(500).send("Error al crear la reservación...");
  }
};

// get all Reservaciones
export const renderAllRervationes = async (req, res) => {
  try {
    const user = req.session.user || { role: "Usuario" };
    const allReservationes = await getAllReservationes();

    // Convertir fechas a formato ISO string para preservar la hora en los atributos HTML
    const reservacionesFormateadas = allReservationes.map(reservacion => ({
      ...reservacion,
      fecha_reserva: reservacion.fecha_reserva ? new Date(reservacion.fecha_reserva).toISOString() : null,
      fecha_ingreso: reservacion.fecha_ingreso ? new Date(reservacion.fecha_ingreso).toISOString() : null,
      fecha_salida: reservacion.fecha_salida ? new Date(reservacion.fecha_salida).toISOString() : null,
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
    console.error("Error al renderrizar las reservaciones:", error?.message || error);
    console.error("Stack:", error?.stack);
    res.status(500).send("Error al cargar las reservaciones");
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

    // Convertir fechas a formato ISO string para preservar la hora en los atributos HTML
    const rentasFormateadas = allRentas.map(renta => ({
      ...renta,
      fecha_ingreso: renta.fecha_ingreso ? new Date(renta.fecha_ingreso).toISOString() : null,
      fecha_salida: renta.fecha_salida ? new Date(renta.fecha_salida).toISOString() : null,
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

  // Convertir fechas para que se guarden correctamente con hora 12:00 local
  console.log('\n🔍 === DEPURACIÓN DE FECHAS (BACKEND) ===');
  console.log('📥 Fecha recibida del frontend (check_in):', check_in);
  console.log('📥 Fecha recibida del frontend (check_out):', check_out);

  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);

  console.log('📅 Date object ANTES de ajustar:');
  console.log('  - checkInDate:', checkInDate.toString());
  console.log('  - checkInDate UTC:', checkInDate.toUTCString());
  console.log('  - checkInDate ISO:', checkInDate.toISOString());

  // Ajustar para que UTC sea 18:00 (no hora local)
  // Si queremos 12:00 local (GMT-6), necesitamos 18:00 UTC
  checkInDate.setUTCHours(18, 0, 0, 0);
  checkOutDate.setUTCHours(18, 0, 0, 0);

  console.log('📅 Date object DESPUÉS de ajustar a 18:00 UTC:');
  console.log('  - checkInDate:', checkInDate.toString());
  console.log('  - checkInDate UTC:', checkInDate.toUTCString());
  console.log('  - checkInDate ISO:', checkInDate.toISOString());
  console.log('  - UTC Hours:', checkInDate.getUTCHours());
  console.log('  - Local Hours:', checkInDate.getHours());

  // Formatear manualmente usando valores UTC para evitar cualquier conversión del driver
  const formatUTCForMySQL = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    // Devolver string puro sin zona horaria para que MySQL lo guarde tal cual
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const check_in_formatted = formatUTCForMySQL(checkInDate);
  const check_out_formatted = formatUTCForMySQL(checkOutDate);

  console.log('💾 Fecha que se enviará a MySQL (string puro):');
  console.log('  - check_in_formatted:', check_in_formatted);
  console.log('  - check_out_formatted:', check_out_formatted);
  console.log('  - Tipo:', typeof check_in_formatted);
  console.log('=== FIN DEPURACIÓN DE FECHAS ===\n');

  // Depuración: mostrar todos los datos recibidos
  console.log("=== Depuración de datos del formulario ===");
  console.log({
    habitacion_id,
    usuario_id,
    client_name,
    email,
    phone,
    check_in_original: check_in,
    check_out_original: check_out,
    check_in_formatted,
    check_out_formatted,
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

    // 2. Insertar renta usando nombres correctos con fechas formateadas
    const rent_id = await createRent({
      room_id: habitacion_id,
      user_id: usuario_id,
      message_method_id: message_method_id,
      client_name: client_name,
      check_in_date: check_in_formatted,
      check_out_date: check_out_formatted,
      payment_type: tipo_pago,
      amount: price,
      amount_text: price_text,
    });

    console.log("Renta creada con ID:", rent_id);

    // Obtener las opciones de envío del formulario
    const { send_email, send_whatsapp } = req.body;

    // Enviar comprobantes automáticamente si están seleccionados
    if (send_email || send_whatsapp) {
      try {
        // Obtener los datos de la renta recién creada para envío
        const rentas = await getAllRentas();
        const rentaCreada = rentas.find(r => r.id_renta === rent_id);

        if (rentaCreada) {
          // Encolar correo si está seleccionado
          if (send_email && email) {
            const mailOptions = {
              to: email,
              subject: `Comprobante de Renta - Habitación ${rentaCreada.numero_habitacion}`,
              html: `
                <h1>Comprobante de Renta</h1>
                <p><strong>Cliente:</strong> ${client_name}</p>
                <p><strong>Habitación:</strong> ${rentaCreada.numero_habitacion}</p>
                <p><strong>Check-in:</strong> ${new Date(rentaCreada.fecha_ingreso).toLocaleString('es-MX')}</p>
                <p><strong>Check-out:</strong> ${new Date(rentaCreada.fecha_salida).toLocaleString('es-MX')}</p>
                <p><strong>Total:</strong> $${price}</p>
                <p>Gracias por su preferencia.</p>
              `
            };
            await jobQueueService.addJob('email', mailOptions);
            console.log("📧 Tarea de envío de correo para la renta encolada.");
          }
        }

        // Enviar por WhatsApp si está seleccionado
        if (send_whatsapp) {
          try {
            const rentSend = await generateAndSendRentPDF({
              telefono: phone,
              renta: {
                id: rentaCreada.id_renta || rent_id,
                client_name,
                phone,
                room_id: habitacion_id,
                check_in: check_in_formatted,
                check_out: check_out_formatted,
                total: price,
                payment_method: payment_type === 'Transfer' ? 'Transferencia' : payment_type
              }
            });

            if (rentSend.success) {
              console.log('✅ PDF de renta enviado por WhatsApp:', rentSend.fileName);
              await pdfRegistry.updateWhatsAppStatus(rentaCreada.id_renta || rent_id, true);
            } else {
              console.log('⚠️ Error en envío de WhatsApp:', rentSend.error);
              await pdfRegistry.updateWhatsAppStatus(rentaCreada.id_renta || rent_id, false);
            }
          } catch (whatsappError) {
            console.error("❌ Error enviando comprobante por WhatsApp:", whatsappError);
          }
        }
      } catch (sendError) {
        console.error("❌ Error en el proceso de envío automático:", sendError);
      }
    }

    res.redirect("/rooms"); // redirigir o mostrar mensaje de éxito
  } catch (err) {
    console.error("Error creando la renta:", err);

    // Verificar si el error es por disponibilidad
    if (err.message && err.message.includes('no está disponible')) {
      return res.status(409).send(`<script>alert('${err.message}'); window.location.href='/rooms';</script>`);
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

    if (!checkIn || !checkOut) {
      return res.json({ available: false, error: "Fechas no proporcionadas" });
    }

    // Verificar disponibilidad usando la función del modelo
    const available = await checkRoomAvailability(roomId, checkIn, checkOut);

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
      return res.json({ success: false, error: 'Datos incompletos' });
    }

    const result = await setNewPrice({
      tipo_habitacion: tipo,
      mes: Number(mes),
      monto: Number(monto)
    });

    if (result) {
      res.json({ success: true, message: 'Precio actualizado correctamente' });
    } else {
      res.json({ success: false, error: 'Error al actualizar el precio' });
    }
  } catch (err) {
    console.error('Error en apiUpdatePrice:', err);
    res.json({ success: false, error: err.message });
  }
};

// Actualizar múltiples precios
export const apiUpdatePricesBulk = async (req, res) => {
  try {
    const { changes } = req.body;

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return res.json({ success: false, error: 'No hay cambios para procesar' });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const change of changes) {
      const { tipo, mes, monto } = change;
      try {
        const result = await setNewPrice({
          tipo_habitacion: tipo,
          mes: Number(mes),
          monto: Number(monto)
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
        message: `${successCount} precios actualizados correctamente`
      });
    } else {
      res.json({
        success: false,
        error: `${errorCount} errores, ${successCount} éxitos`
      });
    }
  } catch (err) {
    console.error('Error en apiUpdatePricesBulk:', err);
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
    const { tipo, fechaInicio, fechaFin, habitacion, cliente, tipoPago } = req.query;

    const filtros = {};
    if (habitacion) filtros.habitacion = habitacion;
    if (cliente) filtros.cliente = cliente;
    if (tipoPago) filtros.tipoPago = tipoPago;

    let reporte;

    switch (tipo) {
      case 'rentas':
        reporte = await ReportService.generateRentReport(fechaInicio, fechaFin, filtros);
        break;
      case 'reservaciones':
        reporte = await ReportService.generateReservationReport(fechaInicio, fechaFin, filtros);
        break;
      case 'consolidado':
        reporte = await ReportService.generateConsolidatedReport(fechaInicio, fechaFin, filtros);
        break;
      default:
        return res.status(400).json({ error: 'Tipo de reporte no válido' });
    }

    res.json({
      success: true,
      reporte
    });

  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar el reporte',
      details: error.message
    });
  }
};

/**
 * Envía reporte por correo electrónico
 */
export const sendReportByEmail = async (req, res) => {
  try {
    const { tipo, fechaInicio, fechaFin, destinatario, asunto, filtros = {} } = req.body;

    // Generar el reporte
    let reporte;
    switch (tipo) {
      case 'rentas':
        reporte = await ReportService.generateRentReport(fechaInicio, fechaFin, filtros);
        break;
      case 'reservaciones':
        reporte = await ReportService.generateReservationReport(fechaInicio, fechaFin, filtros);
        break;
      case 'consolidado':
        reporte = await ReportService.generateConsolidatedReport(fechaInicio, fechaFin, filtros);
        break;
      default:
        return res.status(400).json({ error: 'Tipo de reporte no válido' });
    }

    // Enviar por correo
    await ReportService.sendReportByEmail(reporte, destinatario, asunto);

    res.json({
      success: true,
      message: 'Reporte enviado por correo exitosamente'
    });

  } catch (error) {
    console.error('Error enviando reporte por correo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el reporte por correo',
      details: error.message
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
      case 'rentas':
        reporte = await ReportService.generateRentReport(fechaInicio, fechaFin, filtros);
        break;
      case 'reservaciones':
        reporte = await ReportService.generateReservationReport(fechaInicio, fechaFin, filtros);
        break;
      case 'consolidado':
        reporte = await ReportService.generateConsolidatedReport(fechaInicio, fechaFin, filtros);
        break;
      default:
        return res.status(400).json({ error: 'Tipo de reporte no válido' });
    }

    // Enviar por WhatsApp
    const result = await ReportService.sendReportByWhatsApp(reporte, telefono);

    res.json({
      success: true,
      message: 'Reporte enviado por WhatsApp exitosamente',
      whatsappURL: result.whatsappURL
    });

  } catch (error) {
    console.error('Error enviando reporte por WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el reporte por WhatsApp',
      details: error.message
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
    const renta = rentas.find(r => r.id_renta.toString() === rentaId);

    if (!renta) {
      return res.status(404).json({ error: 'Renta no encontrada' });
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
      montoLetras: renta.monto_letras
    });

    res.json({
      success: true,
      message: 'Comprobante de renta enviado por correo exitosamente'
    });

  } catch (error) {
    console.error('Error enviando comprobante por correo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el comprobante por correo',
      details: error.message
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
    const renta = rentas.find(r => r.id_renta.toString() === rentaId);

    if (!renta) {
      return res.status(404).json({ error: 'Renta no encontrada' });
    }

    const result = await sendRentReceiptWhatsApp({
      phoneNumber: telefono,
      clienteNombre: renta.nombre_cliente,
      numeroHabitacion: renta.numero_habitacion,
      fechaIngreso: renta.fecha_ingreso,
      fechaSalida: renta.fecha_salida,
      tipoPago: renta.tipo_pago,
      monto: renta.monto,
      montoLetras: renta.monto_letras
    });

    res.json({
      success: true,
      message: 'Comprobante de renta enviado por WhatsApp exitosamente',
      whatsappURL: result.whatsappURL
    });

  } catch (error) {
    console.error('Error enviando comprobante por WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el comprobante por WhatsApp',
      details: error.message
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
    const reservacion = reservaciones.find(r => r.id_reservacion.toString() === reservacionId);

    if (!reservacion) {
      return res.status(404).json({ error: 'Reservación no encontrada' });
    }

    await sendReservationReceiptEmail({
      to: destinatario,
      subject: `Comprobante de Reservación - Habitación ${reservacion.numero_habitacion}`,
      clienteNombre: reservacion.nombre_cliente,
      numeroHabitacion: reservacion.numero_habitacion,
      fechaReserva: reservacion.fecha_reserva,
      fechaIngreso: reservacion.fecha_ingreso,
      fechaSalida: reservacion.fecha_salida,
      monto: reservacion.monto
    });

    res.json({
      success: true,
      message: 'Comprobante de reservación enviado por correo exitosamente'
    });

  } catch (error) {
    console.error('Error enviando comprobante por correo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el comprobante por correo',
      details: error.message
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
    const reservacion = reservaciones.find(r => r.id_reservacion.toString() === reservacionId);

    if (!reservacion) {
      return res.status(404).json({ error: 'Reservación no encontrada' });
    }

    const result = await sendReservationReceiptWhatsApp({
      phoneNumber: telefono,
      clienteNombre: reservacion.nombre_cliente,
      numeroHabitacion: reservacion.numero_habitacion,
      fechaReserva: reservacion.fecha_reserva,
      fechaIngreso: reservacion.fecha_ingreso,
      fechaSalida: reservacion.fecha_salida,
      monto: reservacion.monto
    });

    res.json({
      success: true,
      message: 'Comprobante de reservación enviado por WhatsApp exitosamente',
      whatsappURL: result.whatsappURL
    });

  } catch (error) {
    console.error('Error enviando comprobante por WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el comprobante por WhatsApp',
      details: error.message
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
    const reservacion = reservaciones.find(r => r.id_reservacion.toString() === reservacionId);

    if (!reservacion) {
      return res.status(404).json({ error: 'Reservación no encontrada' });
    }

    const result = await sendCheckInReminderWhatsApp({
      phoneNumber: telefono,
      clienteNombre: reservacion.nombre_cliente,
      numeroHabitacion: reservacion.numero_habitacion,
      fechaIngreso: reservacion.fecha_ingreso
    });

    res.json({
      success: true,
      message: 'Recordatorio de check-in enviado por WhatsApp exitosamente',
      whatsappURL: result.whatsappURL
    });

  } catch (error) {
    console.error('Error enviando recordatorio por WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el recordatorio por WhatsApp',
      details: error.message
    });
  }
};
