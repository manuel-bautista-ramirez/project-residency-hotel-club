import crypto from "crypto";
import { savePasswordResetToken, getPasswordResetToken, deletePasswordResetToken } from "../models/passwordRecoveryModel.js";
import { findUserByUsername, updateUserPassword } from "../../login/models/userModel.js";

// 🌟 Generar enlace de recuperación
export const sendPasswordResetLink = async (req, res) => {
  const { username } = req.body;

  try {
    // Buscar usuario por nombre
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).render("requestPassword", { error: "Usuario no encontrado" });
    }

    // Crear token y expiración (1 hora)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000);

    // Guardar token en la tabla password_resets
    await savePasswordResetToken(user.id, token, expiresAt);

    // Crear enlace de recuperación
    const resetLink = `http://localhost:3000/password-reset/reset/${token}`;

    // Mostrar enlace en la interfaz y en consola
    res.render("requestPassword", { success: `${resetLink}` });
    console.log(`Enlace de recuperación generado: ${resetLink}`);
  } catch (error) {
    console.error("Error al generar enlace de recuperación:", error);
    res.status(500).send("Error en el servidor");
  }
};

// 🌟 Restablecer contraseña usando token
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Buscar token en la DB
    const resetToken = await getPasswordResetToken(token);

    if (!resetToken || new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).render("resetPassword", { error: "El token es inválido o ha expirado." });
    }

    // Actualizar contraseña usando el modelo (updateUserPassword hace el hash)
    await updateUserPassword(resetToken.user_id, password);

    // Eliminar token usado
    await deletePasswordResetToken(token);

    res.render("resetPassword", { success: "Contraseña restablecida correctamente." });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).send("Error en el servidor");
  }
};
