import express from 'express';
import { sendPasswordResetLink, resetPassword } from '../controllers/passwordRecoveryController.js';

const router = express.Router();

// Ruta para mostrar el formulario de solicitud de recuperación
router.get('/request', (req, res) => {
  res.render('requestPassword');
});

// Ruta para procesar la solicitud de recuperación
router.post('/request', sendPasswordResetLink);

// Ruta para mostrar el formulario de restablecimiento de contraseña
router.get('/reset/:token', (req, res) => res.render('resetPassword', { token: req.params.token }));

// Ruta para procesar el restablecimiento de contraseña
router.post('/reset/:token', resetPassword);

export default router;
