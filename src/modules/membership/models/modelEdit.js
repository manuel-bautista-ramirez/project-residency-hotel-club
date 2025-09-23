import { pool } from "../../../dataBase/conecctionDataBase.js";

async function updateMembershipById(id, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener el id_cliente de la membresía
    const [membership] = await connection.query(
      "SELECT id_cliente FROM membresias_activas WHERE id_activa = ?",
      [id]
    );

    if (membership.length === 0) {
      throw new Error("Membresía no encontrada");
    }

    const id_cliente = membership[0].id_cliente;

    // 2. Actualizar la información del cliente en la tabla clientes
    const clienteData = {
      nombre_completo: data.membershipData.nombre_completo,
      telefono: data.membershipData.telefono,
      correo: data.membershipData.correo
    };

    await connection.query(
      "UPDATE clientes SET ? WHERE id_cliente = ?",
      [clienteData, id_cliente]
    );

    // 3. Actualizar la información de la membresía en membresias_activas
    const membresiaData = {
      estado: data.membershipData.estado,
      fecha_inicio: data.membershipData.fecha_inicio,
      fecha_fin: data.membershipData.fecha_fin,
      precio_final: data.membershipData.precio_final
    };

    const [membershipResult] = await connection.query(
      "UPDATE membresias_activas SET ? WHERE id_activa = ?",
      [membresiaData, id]
    );

    // 4. Si es membresía familiar, manejar los integrantes
    if (data.tipo === "Familiar" && data.integrantes) {
      // Eliminar integrantes existentes
      await connection.query(
        "DELETE FROM integrantes_membresia WHERE id_activa = ?",
        [id]
      );

      // Insertar nuevos integrantes (solo nombre_completo)
      for (const integrante of data.integrantes) {
        if (integrante.nombre_completo && integrante.nombre_completo.trim() !== '') {
          await connection.query(
            "INSERT INTO integrantes_membresia (id_activa, nombre_completo) VALUES (?, ?)",
            [id, integrante.nombre_completo]
          );
        }
      }
    }

    await connection.commit();
    return membershipResult;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};



export { updateMembershipById };
