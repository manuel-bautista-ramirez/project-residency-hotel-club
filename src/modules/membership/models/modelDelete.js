/**
 * @file modelDelete.js
 * @description Modelo de datos para la eliminación transaccional de membresías.
 * @module models/modelDelete
 */
import { pool } from "../../../dataBase/connectionDataBase.js";

/**
 * Elimina una membresía y todos sus datos relacionados (pagos, integrantes, contrato y, opcionalmente, el cliente)
 * de forma segura dentro de una transacción de base de datos.
 * @async
 * @param {number} id - El ID de la membresía activa (`id_activa`) a eliminar.
 * @returns {Promise<object>} El resultado de la operación de eliminación de la tabla `membresias_activas`.
 * @throws {Error} Si la membresía no se encuentra o si ocurre un error durante la transacción.
 *                 En caso de error, todos los cambios se revierten.
 */
async function deleteMembershipById(id) {
  let connection; // Definir la conexión fuera del bloque try
  try {
    connection = await pool.getConnection(); // Obtener una conexión del pool
    await connection.beginTransaction(); // Iniciar la transacción para garantizar la atomicidad.

    // 1. Primero obtener información de la membresía activa
    const [membresiaActiva] = await connection.query(
      "SELECT id_activa, id_cliente, id_membresia FROM membresias_activas WHERE id_activa = ?",
      [id]
    );

    if (membresiaActiva.length === 0) {
      // Si no se encuentra, no hay nada que borrar. Lanzar un error.
      throw new Error("Membresía no encontrada");
    }

    const { id_cliente, id_membresia } = membresiaActiva[0];

    // 2. Eliminar pagos relacionados (si existen)
    await connection.query("DELETE FROM pagos WHERE id_activa = ?", [id]);

    // 3. Eliminar integrantes (si es membresía familiar)
    await connection.query(
      "DELETE FROM integrantes_membresia WHERE id_activa = ?",
      [id]
    );

    // 4. Eliminar la membresía activa
    const [deleteMembresiaActiva] = await connection.query(
      "DELETE FROM membresias_activas WHERE id_activa = ?",
      [id]
    );

    // 5. Eliminar el contrato de membresía base (de la tabla membresias)
    await connection.query("DELETE FROM membresias WHERE id_membresia = ?", [
      id_membresia,
    ]);

    // 6. Verificar si el cliente tiene otras membresías activas
    const [otrasMembresias] = await connection.query(
      "SELECT COUNT(*) as count FROM membresias_activas WHERE id_cliente = ?",
      [id_cliente]
    );

    // 7. Lógica de negocio: Solo eliminar el cliente si no tiene otras membresías activas.
    if (otrasMembresias[0].count === 0) {
      await connection.query("DELETE FROM clientes WHERE id_cliente = ?", [
        id_cliente,
      ]);
    }

    await connection.commit(); // Confirmar la transacción
    return deleteMembresiaActiva; // Devolver el resultado de la eliminación principal.

  } catch (error) {
    if (connection) await connection.rollback(); // Si algo falla, revertir todos los cambios.
    throw error;
  } finally {
    if (connection) connection.release(); // Siempre liberar la conexión al finalizar.
  }
}

export { deleteMembershipById };