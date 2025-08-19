import express from 'express';
import { sendPasswordResetLink, resetPassword } from '../controllers/passwordRecoveryController.js';

const router = express.Router();

// Solicitar enlace de recuperación
router
  .route('/request')
  .get((req, res) => res.render('requestPassword')) // Mostrar formulario
  .post(sendPasswordResetLink);                     // Enviar enlace

// Restablecer contraseña
router
  .route('/reset/:token')
  .get((req, res) => res.render('resetPassword', { token: req.params.token })) // Mostrar formulario
  .post(resetPassword);                                                         // Procesar reset

export default router;
