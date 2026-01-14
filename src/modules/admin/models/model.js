import { executeQuery } from '../../../dataBase/connectionDataBase.js';

// Obtener todos los usuarios
export const getAllUsers = async () => {
  try {
    const rows = await executeQuery(
      'SELECT id, username, email, role FROM users_hotel ORDER BY id DESC'
    );
    return rows;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

// Buscar usuario por ID
export const findById = async (id) => {
  try {
    const rows = await executeQuery(
      'SELECT id, username, email, password, role FROM users_hotel WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error al buscar usuario por ID:', error);
    throw error;
  }
};

// Actualizar usuario
export const updateUser = async (id, userData) => {
  try {
    const fields = [];
    const values = [];

    if (userData.username !== undefined) {
      fields.push('username = ?');
      values.push(userData.username);
    }

    if (userData.password !== undefined) {
      fields.push('password = ?');
      values.push(userData.password);
    }

    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }

    if (userData.role !== undefined) {
      fields.push('role = ?');
      values.push(userData.role);
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(id);

    const result = await executeQuery(
      `UPDATE users_hotel SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

// Eliminar usuario
export const deleteUser = async (id) => {
  try {
    const result = await executeQuery(
      'DELETE FROM users_hotel WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

// Obtener estadísticas de usuarios
export const getUserStats = async () => {
  try {
    const totalUsers = await executeQuery(
      'SELECT COUNT(*) as total FROM users_hotel'
    );

    const adminUsers = await executeQuery(
      'SELECT COUNT(*) as total FROM users_hotel WHERE role = "Administrador"'
    );

    const regularUsers = await executeQuery(
      'SELECT COUNT(*) as total FROM users_hotel WHERE role = "Usuario"'
    );

    // Obtener actividad reciente (usuarios que han hecho reservaciones en los últimos 30 días)
    const recentActivity = await executeQuery(`
      SELECT COUNT(DISTINCT usuario_id) as active_users
      FROM reservaciones
      WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    return {
      total: totalUsers[0].total,
      administrators: adminUsers[0].total,
      regularUsers: regularUsers[0].total,
      recentlyActive: recentActivity[0].active_users
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    throw error;
  }
};

// Actualizar estado del usuario (para futuras funcionalidades)
export const updateUserStatus = async (id, active) => {
  try {
    // Por ahora, como la tabla no tiene campo 'active',
    // podemos simular esto o agregar el campo en el futuro
    // Para este ejemplo, simplemente retornamos true
    return true;
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error);
    throw error;
  }
};

// Obtener usuarios con información de actividad
export const getUsersWithActivity = async () => {
  try {
    const rows = await executeQuery(`
      SELECT
        u.id,
        u.username,
        u.role,
        COUNT(r.id) as total_reservations,
        MAX(r.fecha_registro) as last_activity
      FROM users_hotel u
      LEFT JOIN reservaciones r ON u.id = r.usuario_id
      GROUP BY u.id, u.username, u.role
      ORDER BY u.id DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error al obtener usuarios con actividad:', error);
    throw error;
  }
};

// Validar si un usuario puede ser eliminado
export const canDeleteUser = async (id) => {
  try {
    // Verificar si el usuario tiene reservaciones
    const reservations = await executeQuery(
      'SELECT COUNT(*) as count FROM reservaciones WHERE usuario_id = ?',
      [id]
    );

    // Verificar si el usuario tiene rentas
    const rents = await executeQuery(
      'SELECT COUNT(*) as count FROM rentas WHERE usuario_id = ?',
      [id]
    );

    // Verificar si el usuario tiene ventas
    const sales = await executeQuery(
      'SELECT COUNT(*) as count FROM ventas WHERE usuario_id = ?',
      [id]
    );

    const hasActivity = reservations[0].count > 0 || rents[0].count > 0 || sales[0].count > 0;

    return {
      canDelete: !hasActivity,
      reasons: {
        hasReservations: reservations[0].count > 0,
        hasRents: rents[0].count > 0,
        hasSales: sales[0].count > 0
      },
      counts: {
        reservations: reservations[0].count,
        rents: rents[0].count,
        sales: sales[0].count
      }
    };
  } catch (error) {
    console.error('Error al validar eliminación de usuario:', error);
    throw error;
  }
};

// Eliminar reservaciones por ID de usuario
export const deleteReservationsByUserId = async (userId) => {
  try {
    const result = await executeQuery(
      'DELETE FROM reservaciones WHERE usuario_id = ?',
      [userId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar reservaciones del usuario:', error);
    throw error;
  }
};

// Eliminar rentas por ID de usuario
export const deleteRentsByUserId = async (userId) => {
  try {
    const result = await executeQuery(
      'DELETE FROM rentas WHERE usuario_id = ?',
      [userId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar rentas del usuario:', error);
    throw error;
  }
};

// Eliminar entradas diarias por ID de usuario
export const deleteDailyEntriesByUserId = async (userId) => {
  try {
    const result = await executeQuery(
      'DELETE FROM daily_entries WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error al eliminar entradas diarias del usuario:', error);
    throw error;
  }
};
