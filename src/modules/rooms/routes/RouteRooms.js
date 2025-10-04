// routerRoom.js
import express from "express";
import {
  authMiddleware,
  roleMiddleware,
} from "../../login/middlewares/accessDenied.js";

import {
  renderHabitacionesView,
  renderFormEditarReservacion,
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

routerRoom.post("/rooms/delete/:id", deleteByIdResevation);
routerRoom.post("/rentas/eliminar/:id", deleteIdRenta);

// routerRoom.get("/rooms/calendario", renderCalendario)
// routerRoom.get('/rooms/calendario', fetchEventos);

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
