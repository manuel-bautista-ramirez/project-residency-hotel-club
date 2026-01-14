import express from "express";
import {
  renderMainPage,
  renderAllEntries,
  createNewEntry,
  deleteEntry,
  updateEntry,
  renderReports,
  bulkDeleteEntries,
  updateSettings // <-- IMPORTANTE: Agregamos esta importación
} from "../controllers/dailyEntriesController.js";

import { authMiddleware, roleMiddleware } from "../../../middlewares/validation/accessDenied.js";

const entriesRouter = express.Router();

// Require auth for all entries routes
entriesRouter.use(authMiddleware);

/*** --- VISTAS --- ***/
entriesRouter.get("/entries", renderMainPage);
entriesRouter.get("/entries/list", renderAllEntries);

// Protect reports route (only admin)
entriesRouter.get("/entries/reports", roleMiddleware("Administrador"), renderReports);

/*** --- API / ACCIONES --- ***/

// Crear entrada
entriesRouter.post("/api/entries", createNewEntry);

// Nueva ruta: Actualizar precios base (Solo Admin)
// CAMBIO: Usamos 'entriesRouter' en lugar de 'router'
entriesRouter.post("/api/entries/update-settings", roleMiddleware("Administrador"), updateSettings);

// Eliminación masiva (Solo Admin)
entriesRouter.post("/api/entries/bulk-delete", roleMiddleware("Administrador"), bulkDeleteEntries);

// Acciones individuales (Solo Admin)
// ...existing routes...
entriesRouter.post("/api/entries/:id/edit", roleMiddleware("Administrador"), updateEntry);
entriesRouter.post("/api/entries/:id/delete", roleMiddleware("Administrador"), deleteEntry);

// Rutas de envío de reportes
import { sendReportEmail, sendReportWhatsApp } from "../controllers/dailyEntriesController.js";
entriesRouter.post("/api/entries/reports/email", roleMiddleware("Administrador"), sendReportEmail);
entriesRouter.post("/api/entries/reports/whatsapp", roleMiddleware("Administrador"), sendReportWhatsApp);

export { entriesRouter };
