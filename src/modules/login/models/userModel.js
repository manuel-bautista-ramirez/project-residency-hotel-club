import bcrypt from "bcrypt";
import { pool } from "../../../dataBase/connectionDataBase.js";

const SALT_ROUNDS = 10; // Constante para las rondas de hash

//  Agregar usuario (con contraseña)
export const addUser = async (username, password, role) => {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const query =
      "INSERT INTO users_hotel (username, password, role) VALUES (?, ?, ?)";
    const [result] = await pool.query(query, [username, hashedPassword, role]);
    console.log(`Usuario ${username} agregado con ID ${result.insertId}.`);
  } catch (error) {
    console.error(`Error al agregar el usuario ${username}:`, error);
    throw error;
  }
};

// Agregar usuario sin contraseña (para que la cree en primer login)
export const addUserWithoutPassword = async (username, email, role) => {
  try {
    const query =
      "INSERT INTO users_hotel (username, email, role, password) VALUES (?, ?, ?, NULL)";
    const [result] = await pool.query(query, [username, email, role]);
    console.log(`Usuario ${username} creado sin contraseña con ID ${result.insertId}. Email: ${email}`);
    return result.insertId;
  } catch (error) {
    console.error(`Error al agregar el usuario ${username}:`, error);
    throw error;
  }
};

// Buscar usuario por username
export const findUserByUsername = async (username) => {
  try {
    const query = "SELECT * FROM users_hotel WHERE username = ?";
    const [rows] = await pool.query(query, [username]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Error al buscar el usuario ${username}:`, error);
    throw error;
  }
};

// Verificar contraseña
export const verifyPassword = async (inputPassword, storedPassword) => {
  if (!inputPassword || !storedPassword) {
    console.error("Error: Contraseña ingresada o almacenada es inválida.");
    return false;
  }
  try {
    return await bcrypt.compare(inputPassword, storedPassword);
  } catch (error) {
    console.error("❌ Error al verificar la contraseña:", error);
    return false;
  }
};

// Actualizar contraseña de un usuario por ID
export const updateUserPassword = async (userId, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const query = "UPDATE users_hotel SET password = ? WHERE id = ?";
    const [result] = await pool.query(query, [hashedPassword, userId]);
    console.log(`Contraseña del usuario ${userId} actualizada.`, result);
  } catch (error) {
    console.error(
      `Error al actualizar la contraseña del usuario ${userId}:`,
      error
    );
    throw error;
  }
};

// Actualizar contraseña de un usuario por username
export const updateUserPasswordByUsername = async (username, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const query = "UPDATE users_hotel SET password = ? WHERE username = ?";
    const [result] = await pool.query(query, [hashedPassword, username]);
    console.log(`Contraseña del usuario ${username} actualizada.`, result);
  } catch (error) {
    console.error(
      ` Error al actualizar la contraseña del usuario ${username}:`,
      error
    );
    throw error;
  }
};

// Login de usuario
export const loginUser = async (username, password) => {
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("Contraseña incorrecta");
    }

    console.log(`Usuario ${username} autenticado correctamente.`);
    return user;
  } catch (error) {
    console.error(`Error en login de usuario ${username}:`, error.message);
    throw error;
  }
};

// Guardar token de recuperación
export const savePasswordResetToken = async (userId, token, expiresAt) => {
  try {
    const query = `
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE token = ?, expires_at = ?`;
    await pool.query(query, [userId, token, expiresAt, token, expiresAt]);
    console.log(`Token de recuperación guardado para usuario ${userId}`);
  } catch (error) {
    console.error("Error al guardar el token de recuperación:", error);
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
    console.error("Error al obtener el token de recuperación:", error);
    throw error;
  }
};

// Eliminar token
export const deletePasswordResetToken = async (token) => {
  try {
    const query = "DELETE FROM password_resets WHERE token = ?";
    await pool.query(query, [token]);
    console.log(`Token eliminado: ${token}`);
  } catch (error) {
    console.error("Error al eliminar el token de recuperación:", error);
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

    console.log(`Contraseña del usuario ${userId} actualizada.`);
    return true;
  } catch (error) {
    console.error("Error al resetear la contraseña:", error);
    throw error;
  }
};

// =====================================================
// NUEVAS FUNCIONES PARA RECUPERACIÓN POR EMAIL
// =====================================================

// Buscar usuario por email
export const findUserByEmail = async (email) => {
  try {
    const query = "SELECT * FROM users_hotel WHERE email = ?";
    const [rows] = await pool.query(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Error al buscar el usuario por email ${email}:`, error);
    throw error;
  }
};

// Guardar código de recuperación (6 dígitos)
export const savePasswordResetCode = async (userId, code, expiresAt) => {
  try {
    const query = `
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE token = ?, expires_at = ?`;
    await pool.query(query, [userId, code, expiresAt, code, expiresAt]);
    console.log(`Código de recuperación guardado para usuario ${userId}: ${code}`);
  } catch (error) {
    console.error("Error al guardar el código de recuperación:", error);
    throw error;
  }
};

// Obtener código de recuperación
export const getPasswordResetCode = async (code) => {
  try {
    const query = "SELECT * FROM password_resets WHERE token = ?";
    const [rows] = await pool.query(query, [code]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error al obtener el código de recuperación:", error);
    throw error;
  }
};

// Eliminar código de recuperación
export const deletePasswordResetCode = async (code) => {
  try {
    const query = "DELETE FROM password_resets WHERE token = ?";
    await pool.query(query, [code]);
    console.log(`Código eliminado: ${code}`);
  } catch (error) {
    console.error("Error al eliminar el código de recuperación:", error);
    throw error;
  }
};

