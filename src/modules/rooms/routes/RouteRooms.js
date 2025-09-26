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
  renderRentForm,
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
routerRoom.post("/rooms/createRenta/:id", handleCreateRenta);

routerRoom.get("/rooms/editar/:id", renderFormEditarReservacion);

routerRoom.post("/rooms/delete/:id", deleteByIdResevation);
routerRoom.post("/rentas/eliminar/:id", deleteIdRenta);

// routerRoom.get("/rooms/calendario", renderCalendario)
// routerRoom.get('/rooms/calendario', fetchEventos);

// ----- API for promesas -----

routerRoom.get("/api/rooms/:id/price", apiGetPriceByMonth);
routerRoom.get("/api/rooms/:id/available", apiCheckAvailability);


routerRoom.get("/rooms/rent/:id", renderRentForm);

export { routerRoom };
