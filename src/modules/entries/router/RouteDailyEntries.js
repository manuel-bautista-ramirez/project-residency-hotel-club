// RouteDailyEntries.js
import express from "express";
import {
  renderMainPage,
  renderAllEntries,
  createNewEntry,
  deleteEntry,
  updateEntry,
  renderReports
} from "../controllers/dailyEntriesController.js";

import { authMiddleware, roleMiddleware } from "../../login/middlewares/accessDenied.js";

const entriesRouter = express.Router();

// Require auth for all entries routes
entriesRouter.use(authMiddleware);

// Views
entriesRouter.get("/entries", renderMainPage);
entriesRouter.get("/entries/list", renderAllEntries);

// Protect reports route (only admin)
entriesRouter.get("/entries/reports", roleMiddleware("Administrador"), renderReports);

// API
entriesRouter.post("/api/entries", createNewEntry);

// Admin actions
entriesRouter.post("/api/entries/:id/edit", roleMiddleware("Administrador"), updateEntry);
entriesRouter.post("/api/entries/:id/delete", roleMiddleware("Administrador"), deleteEntry);

export { entriesRouter };


