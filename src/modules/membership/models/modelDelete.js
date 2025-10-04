import { pool } from "../../../dataBase/connectionDataBase.js";

async function deleteMembershipById(id) {
  let connection; // Definir la conexión fuera del bloque try
  try {
    connection = await pool.getConnection(); // Obtener una conexión del pool
    await connection.beginTransaction(); // Iniciar la transacción

    // 1. Primero obtener información de la membresía activa
    const [membresiaActiva] = await connection.query(
      "SELECT id_activa, id_cliente, id_membresia FROM membresias_activas WHERE id_activa = ?",
      [id]
    );

    if (membresiaActiva.length === 0) {
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

    // 5. Eliminar la membresía base (de la tabla membresias)
    await connection.query("DELETE FROM membresias WHERE id_membresia = ?", [
      id_membresia,
    ]);

    // 6. Verificar si el cliente tiene otras membresías activas
    const [otrasMembresias] = await connection.query(
      "SELECT COUNT(*) as count FROM membresias_activas WHERE id_cliente = ?",
      [id_cliente]
    );

    // 7. Solo eliminar el cliente si no tiene otras membresías activas
    if (otrasMembresias[0].count === 0) {
      await connection.query("DELETE FROM clientes WHERE id_cliente = ?", [
        id_cliente,
      ]);
    }

    await connection.commit(); // Confirmar la transacción
    return deleteMembresiaActiva;

  } catch (error) {
    if (connection) await connection.rollback(); // Revertir en caso de error
    throw error;
  } finally {
    if (connection) connection.release(); // Liberar la conexión de vuelta al pool
  }
}

export { deleteMembershipById };