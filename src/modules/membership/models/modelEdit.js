/**
 * @file modelEdit.js
 * @description Modelo de datos para las operaciones de edición de membresías.
 * Contiene la lógica transaccional para actualizar una membresía y sus datos relacionados.
 * @module models/modelEdit
 */
import { pool } from "../../../dataBase/connectionDataBase.js";

/**
 * Actualiza una membresía completa y sus datos asociados (cliente, integrantes) dentro de una transacción.
 * @async
 * @param {number} id - El ID de la membresía activa (`id_activa`) a actualizar.
 * @param {object} data - Objeto que contiene los datos a actualizar.
 * @param {object} data.membershipData - Datos del cliente y de la membresía.
 * @param {string} data.membershipData.nombre_completo - Nombre del cliente.
 * @param {string} data.membershipData.telefono - Teléfono del cliente.
 * @param {string} data.membershipData.correo - Correo del cliente.
 * @param {string} data.membershipData.estado - Nuevo estado de la membresía.
 * @param {string} data.membershipData.fecha_inicio - Nueva fecha de inicio.
 * @param {string} data.membershipData.fecha_fin - Nueva fecha de fin.
 * @param {number} data.membershipData.precio_final - Nuevo precio final.
 * @param {number} [data.membershipData.id_tipo_membresia] - ID del nuevo tipo de membresía (importante para renovaciones).
 * @param {string} data.tipo - El tipo de membresía (ej. 'Familiar').
 * @param {Array<object>} [data.integrantes] - Array de integrantes para membresías familiares. Cada objeto debe tener `nombre_completo`.
 * @returns {Promise<object>} El resultado de la operación de actualización de la tabla `membresias_activas`.
 * @throws {Error} Si la membresía no se encuentra o si ocurre un error en la base de datos. La transacción se revierte en caso de error.
 */
async function updateMembershipById(id, data) {
  const connection = await pool.getConnection();

  try {
    // Inicia una transacción para asegurar la integridad de los datos.
    await connection.beginTransaction();

    // 1. Obtener el id_cliente de la membresía
    const [membership] = await connection.query(
      "SELECT id_cliente, id_membresia FROM membresias_activas WHERE id_activa = ?",
      [id]
    );

    if (membership.length === 0) {
      throw new Error("Membresía no encontrada");
    }

    const { id_cliente, id_membresia } = membership[0];

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

    // 4. Si se proporciona un nuevo tipo de membresía (en renovaciones), actualizar el contrato base.
    if (data.membershipData.id_tipo_membresia) {
      await connection.query(
        "UPDATE membresias SET id_tipo_membresia = ? WHERE id_membresia = ?",
        [data.membershipData.id_tipo_membresia, id_membresia]
      );
    }

    // 5. Manejar integrantes (borrar y re-insertar para mantener consistencia)
    // Primero, siempre eliminamos los integrantes existentes para limpiar.
    // Si la membresía se cambia de Familiar a Individual, esto asegura que los integrantes antiguos se eliminen.
    await connection.query(
      "DELETE FROM integrantes_membresia WHERE id_activa = ?",
      [id]
    );

    // Luego, si el nuevo tipo es Familiar y se proporcionan integrantes, los insertamos.
    if (data.tipo === "Familiar" && data.integrantes) {
      // Se insertan los nuevos integrantes enviados desde el formulario.
      for (const integrante of data.integrantes) {
        if (integrante.nombre_completo && integrante.nombre_completo.trim() !== '') {
          await connection.query(
            "INSERT INTO integrantes_membresia (id_activa, nombre_completo) VALUES (?, ?)",
            [id, integrante.nombre_completo]
          );
        }
      }
    }

    // Si todas las operaciones fueron exitosas, se confirman los cambios en la base de datos.
    await connection.commit();
    return membershipResult;
  } catch (error) {
    // Si ocurre cualquier error, se revierten todos los cambios hechos durante la transacción.
    await connection.rollback();
    throw error;
  } finally {
    // Se asegura de que la conexión se libere de vuelta al pool, sin importar el resultado.
    connection.release();
  }
};



export { updateMembershipById };
