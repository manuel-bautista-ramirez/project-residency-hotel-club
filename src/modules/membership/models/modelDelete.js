import { pool } from "../../../dataBase/conecctionDataBase.js";

async function deleteMembershipById(id) {

  try {


    // 1. Primero obtener información de la membresía activa
    const [membresiaActiva] = await pool.query(
      "SELECT id_activa, id_cliente, id_membresia FROM membresias_activas WHERE id_activa = ?",
      [id]
    );

    if (membresiaActiva.length === 0) {
      throw new Error("Membresía no encontrada");
    }

    const { id_cliente, id_membresia } = membresiaActiva[0];

    // 2. Eliminar pagos relacionados (si existen)
    await  pool.query("DELETE FROM pagos WHERE id_activa = ?", [id]);

    // 3. Eliminar integrantes (si es membresía familiar)
    await  pool.query(
      "DELETE FROM integrantes_membresia WHERE id_activa = ?",
      [id]
    );

    // 4. Eliminar la membresía activa
    const [deleteMembresiaActiva] = await  pool.query(
      "DELETE FROM membresias_activas WHERE id_activa = ?",
      [id]
    );

    // 5. Eliminar la membresía base (de la tabla membresias)
    await pool.query("DELETE FROM membresias WHERE id_membresia = ?", [
      id_membresia,
    ]);

    // 6. Verificar si el cliente tiene otras membresías activas
    const [otrasMembresias] = await  pool.query(
      "SELECT COUNT(*) as count FROM membresias_activas WHERE id_cliente = ?",
      [id_cliente]
    );

    // 7. Solo eliminar el cliente si no tiene otras membresías activas
    if (otrasMembresias[0].count === 0) {
      await connection.query("DELETE FROM clientes WHERE id_cliente = ?", [
        id_cliente,
      ]);
    }

    await  pool.commit();
    return deleteMembresiaActiva;
  } catch (error) {
    await  pool.rollback();
    throw error;
  } finally {
    pool.release();
  }
}

export { deleteMembershipById };
