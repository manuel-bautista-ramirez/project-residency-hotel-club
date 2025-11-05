// routerRoom.js
import express from "express";
import {
  authMiddleware,

} from "../../../middlewares/validation/accessDenied.js";

import {
  renderHabitacionesView,
  renderFormEditarReservacion,
  handleEditReservation,
  renderAllPriceView,
  renderAllRentas,
  renderReservacionesView,
  renderFormRentar,
  createResevation,
  handleCreateRenta,
  renderAllRervationes,
  deleteByIdResevation,
  changesStatus,
  deleteIdRenta,
  marcarComoDesocupada,
  handleCreateReservation,
  apiCheckAvailability,
  apiGetPriceByMonth,
  apiUpdatePrice,
  apiUpdatePricesBulk,
  renderRentForm,
  // Nuevas funciones para reportes y mensajería
  generateReport,
  sendReportByEmail,
  sendReportByWhatsApp,
  sendRentReceiptByEmail,
  sendRentReceiptByWhatsApp,
  sendReservationReceiptByEmail,
  sendReservationReceiptByWhatsApp,
  sendCheckInReminder,
  // Funciones para conversión de reservación a renta
  renderConvertReservationToRent,
  handleConvertReservationToRent,
  // Funciones para calendario
  renderCalendarioRooms,
  getCalendarData,
} from "../controllers/roomsController.js";

const routerRoom = express.Router();

// --- Middleware de autenticación para todas las rutas ---
routerRoom.use(authMiddleware);

// ----- VISTAS PRINCIPALES -----
routerRoom.get("/rooms", renderHabitacionesView);
routerRoom.get("/rooms/list/reservations", renderAllRervationes);
routerRoom.get("/rooms/list/rentas", renderAllRentas);

routerRoom.get("/rooms/precios", renderAllPriceView);
routerRoom.get("/rooms/reportes", renderReservacionesView);

// ----- FORMULARIOS INDIVIDUALES -----
routerRoom.get("/rooms/reservar/:id", createResevation);
routerRoom.post("/rooms/reservar/:id", handleCreateReservation);

routerRoom.post("/rooms/changes/status/:id", changesStatus);

routerRoom.get("/rooms/rentar/:id", renderFormRentar);  
routerRoom.post("/rooms/create-renta/:id", handleCreateRenta);

routerRoom.get("/rooms/editar/:id", renderFormEditarReservacion);
routerRoom.post("/api/reservaciones/:id/editar", handleEditReservation);

// ----- CONVERSIÓN DE RESERVACIÓN A RENTA -----
routerRoom.get("/rooms/confirmReservations/renta/:id", renderConvertReservationToRent);
routerRoom.post("/api/rooms/convertReservationToRent/:id", handleConvertReservationToRent);

routerRoom.post("/rooms/delete/:id", deleteByIdResevation);
routerRoom.post("/rentas/eliminar/:id", deleteIdRenta);
routerRoom.post("/rooms/desocupar/:id", marcarComoDesocupada);

// ----- CALENDARIO -----
routerRoom.get("/rooms/list/calendario", renderCalendarioRooms);
routerRoom.get("/api/rooms/calendar-data", getCalendarData);

// ----- API for promesas -----

routerRoom.get("/api/rooms/:id/price", apiGetPriceByMonth);
routerRoom.get("/api/rooms/:id/available", apiCheckAvailability);
routerRoom.post("/api/rooms/update-precio", apiUpdatePrice);
routerRoom.post("/api/rooms/update-precios-bulk", apiUpdatePricesBulk);

routerRoom.get("/rooms/rent/:id", renderRentForm);

// ----- RUTAS PARA REPORTES -----
routerRoom.get("/api/rooms/reports/generate", generateReport);
routerRoom.post("/api/rooms/reports/send-email", sendReportByEmail);
routerRoom.post("/api/rooms/reports/send-whatsapp", sendReportByWhatsApp);

// ----- RUTAS PARA ENVÍO DE COMPROBANTES -----
routerRoom.post("/api/rooms/rentas/:rentaId/send-email", sendRentReceiptByEmail);
routerRoom.post("/api/rooms/rentas/:rentaId/send-whatsapp", sendRentReceiptByWhatsApp);
routerRoom.post("/api/rooms/reservaciones/:reservacionId/send-email", sendReservationReceiptByEmail);
routerRoom.post("/api/rooms/reservaciones/:reservacionId/send-whatsapp", sendReservationReceiptByWhatsApp);

// ----- RUTAS PARA RECORDATORIOS -----
routerRoom.post("/api/rooms/reservaciones/:reservacionId/send-reminder", sendCheckInReminder);

export { routerRoom };
