import bcrypt from "bcrypt";
import { pool } from "../../../dataBase/conecctionDataBase.js";

const SALT_ROUNDS = 10;

// Guardar token de recuperación
export const savePasswordResetToken = async (userId, token, expiresAt) => {
  try {
    const query = `
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE token = ?, expires_at = ?`;
    await pool.query(query, [userId, token, expiresAt, token, expiresAt]);
    console.log(`✅ Token de recuperación guardado para usuario ${userId}`);
  } catch (error) {
    console.error("❌ Error al guardar el token de recuperación:", error);
    throw error;
  }
};

// Obtener token
export const getPasswordResetToken = async (token) => {
  try {
    const query = "SELECT * FROM password_resets WHERE token = ?";
    const [rows] = await pool.query(query, [token]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("❌ Error al obtener el token de recuperación:", error);
    throw error;
  }
};

// Eliminar token
export const deletePasswordResetToken = async (token) => {
  try {
    const query = "DELETE FROM password_resets WHERE token = ?";
    await pool.query(query, [token]);
    console.log(`🗑️ Token eliminado: ${token}`);
  } catch (error) {
    console.error("❌ Error al eliminar el token de recuperación:", error);
    throw error;
  }
};

// Resetear contraseña
export const resetPassword = async (userId, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const query = "UPDATE users_hotel SET password = ? WHERE id = ?";
    const [result] = await pool.query(query, [hashedPassword, userId]);

    if (result.affectedRows === 0) {
      throw new Error("No se pudo actualizar la contraseña (usuario no encontrado).");
    }

    console.log(`✅ Contraseña del usuario ${userId} actualizada.`);
    return true;
  } catch (error) {
    console.error("❌ Error al resetear la contraseña:", error);
    throw error;
  }
};
