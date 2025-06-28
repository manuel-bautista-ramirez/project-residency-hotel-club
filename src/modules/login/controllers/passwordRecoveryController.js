import crypto from 'crypto';
import { savePasswordResetToken, getPasswordResetToken, deletePasswordResetToken } from '../models/passwordRecoveryModel.js';
import { findUserByUsername, updateUserPassword } from '../../login/models/userModel.js';
import bcrypt from 'bcrypt';

// Generar enlace de recuperación
export const sendPasswordResetLink = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await findUserByUsername(username); // Buscar usuario por nombre de usuario
    if (!user) {
      return res.status(404).render('requestPassword', { error: 'Usuario no encontrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora
    await savePasswordResetToken(user.id, token, expiresAt);

    const resetLink = `http://localhost:3000/password-reset/reset/${token}`;

    // Mostrar el enlace en la interfaz
    res.render('requestPassword', { success: `${resetLink}` });

    // También puedes mostrarlo en la terminal para pruebas
    console.log(`Enlace de recuperación generado: ${resetLink}`);
  } catch (error) {
    console.error('Error al generar enlace de recuperación:', error);
    res.status(500).send('Error en el servidor');
  }
};

// Restablecer contraseña
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const resetToken = await getPasswordResetToken(token);
    if (!resetToken || new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).render('resetPassword', { error: 'El token es inválido o ha expirado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await updateUserPassword(resetToken.user_id, hashedPassword); // Actualizar contraseña
    await deletePasswordResetToken(token); // Eliminar token usado

    res.render('resetPassword', { success: 'Contraseña restablecida correctamente.' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).send('Error en el servidor');
  }
};
