/**
 * @file modelAccess.js
 * @description Modelo de datos para registrar y consultar el acceso de membresías.
 * @module models/modelAccess
 */
import { pool } from "../../../dataBase/connectionDataBase.js";

/**
 * Objeto que encapsula los métodos para las consultas de registro de acceso.
 * @type {object}
 */
export const modelAccess = {
  /**
   * Inserta un nuevo registro en la tabla de entradas.
   * @param {object} entryData - Datos de la entrada.
   * @param {number} entryData.id_activa - El ID de la membresía activa.
   * @param {string} entryData.area_acceso - El área por la que se accedió.
   * @returns {Promise<number>} El ID del registro de entrada insertado.
   */
  async recordEntry({ id_activa, area_acceso }) {
    try {
      const query = `
        INSERT INTO registro_entradas (id_activa, area_acceso)
        VALUES (?, ?);
      `;
      const [result] = await pool.query(query, [id_activa, area_acceso]);
      return result.insertId;
    } catch (error) {
      console.error("Error al registrar la entrada de la membresía:", error);
      throw new Error("No se pudo registrar la entrada en la base de datos.");
    }
  },

  /**
   * Obtiene el historial de entradas para una fecha específica.
   * @param {string} date - La fecha a consultar en formato 'YYYY-MM-DD'.
   * @returns {Promise<Array<object>>} Un array con los registros de entrada.
   */
  async getEntriesByDate(date) {
    try {
      const query = `
        SELECT
          re.id_entrada,
          re.fecha_hora_entrada,
          re.area_acceso,
          c.nombre_completo AS titular
        FROM registro_entradas re
        JOIN membresias_activas ma ON re.id_activa = ma.id_activa
        JOIN clientes c ON ma.id_cliente = c.id_cliente
        WHERE DATE(re.fecha_hora_entrada) = ?
        ORDER BY re.fecha_hora_entrada DESC;
      `;
      const [rows] = await pool.query(query, [date]);
      return rows;
    } catch (error) {
      console.error("Error al obtener el historial de entradas:", error);
      throw new Error("No se pudo obtener el historial de entradas.");
    }
  }
};
