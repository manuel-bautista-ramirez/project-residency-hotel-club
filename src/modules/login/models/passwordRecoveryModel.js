import database from '../../../dataBase/conecctionDataBase.js';

// Guardar el token de recuperación en la base de datos
export const savePasswordResetToken = async (userId, token, expiresAt) => {
  const query = `
    INSERT INTO password_resets (user_id, token, expires_at)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE token = ?, expires_at = ?`;
  await database.query(query, [userId, token, expiresAt, token, expiresAt]);
};

// Obtener el token de recuperación
export const getPasswordResetToken = async (token) => {
  const query = 'SELECT * FROM password_resets WHERE token = ?';
  const results = await database.query(query, [token]);
  return results[0];
};

// Eliminar el token después de usarlo
export const deletePasswordResetToken = async (token) => {
  const query = 'DELETE FROM password_resets WHERE token = ?';
  await database.query(query, [token]);
};
