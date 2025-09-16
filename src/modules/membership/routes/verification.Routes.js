// routes/verification.Routes.js
import express from "express";
import { verificationController } from "../controllers/verificationController.js";

const routerVerification = express.Router();

// Ruta para verificar la membresía desde un QR
// Espera que el QR contenga una URL como: .../memberships/verify?data=<JSON_codificado>
routerVerification.get("/verify", verificationController.verifyMembership);

export { routerVerification as verificationRoutes };
