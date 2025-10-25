/**
 * @file modelManage.js
 * @description Modelo de datos para las operaciones de configuración de membresías.
 * @module models/ManageModel
 */
import { pool } from "../../../dataBase/connectionDataBase.js";

const ManageModel = {
  // --- TIPOS DE MEMBRESÍA ---

  /**
   * Obtiene todos los tipos de membresía.
   */
  async getTiposMembresia() {
    const [rows] = await pool.query("SELECT * FROM tipos_membresia ORDER BY nombre");
    return rows;
  },

  /**
   * Crea un nuevo tipo de membresía.
   */
  async createTipoMembresia({ nombre, descripcion, max_integrantes, precio }) {
    const [result] = await pool.query(
      "INSERT INTO tipos_membresia (nombre, descripcion, max_integrantes, precio) VALUES (?, ?, ?, ?)",
      [nombre, descripcion, max_integrantes, precio]
    );
    return { id: result.insertId, nombre, descripcion, max_integrantes, precio };
  },

  /**
   * Actualiza un tipo de membresía.
   */
  async updateTipoMembresia(id, { nombre, descripcion, max_integrantes, precio }) {
    const [result] = await pool.query(
      "UPDATE tipos_membresia SET nombre = ?, descripcion = ?, max_integrantes = ?, precio = ? WHERE id_tipo_membresia = ?",
      [nombre, descripcion, max_integrantes, precio, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Elimina un tipo de membresía.
   */
  async deleteTipoMembresia(id) {
    const [result] = await pool.query("DELETE FROM tipos_membresia WHERE id_tipo_membresia = ?", [id]);
    return result.affectedRows > 0;
  },

  // --- MÉTODOS DE PAGO ---

  /**
   * Obtiene todos los métodos de pago.
   */
  async getMetodosPago() {
    const [rows] = await pool.query("SELECT * FROM metodos_pago ORDER BY nombre");
    return rows;
  },

  /**
   * Crea un nuevo método de pago.
   */
  async createMetodoPago({ nombre }) {
    const [result] = await pool.query("INSERT INTO metodos_pago (nombre) VALUES (?)", [nombre]);
    return { id: result.insertId, nombre };
  },

  /**
   * Actualiza un método de pago.
   */
  async updateMetodoPago(id, { nombre }) {
    const [result] = await pool.query("UPDATE metodos_pago SET nombre = ? WHERE id_metodo_pago = ?", [nombre, id]);
    return result.affectedRows > 0;
  },

  /**
   * Elimina un método de pago.
   */
  async deleteMetodoPago(id) {
    const [result] = await pool.query("DELETE FROM metodos_pago WHERE id_metodo_pago = ?", [id]);
    return result.affectedRows > 0;
  },
};

export { ManageModel };
