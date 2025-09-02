// models/modelMembership.js
import { pool } from "../../../dataBase/conecctionDataBase.js";

const MembershipModel = {
  async createClient({ nombre_completo, telefono, correo }) {
    try {
      const [result] = await pool.query(
        `INSERT INTO clientes (nombre_completo, telefono, correo)
         VALUES (?, ?, ?)`,
        [nombre_completo, telefono, correo]
      );

      if (!result || (result.affectedRows === 0 && !result.insertId)) {
        throw new Error("No se pudo crear el cliente en la base de datos");
      }

      return {
        id_cliente: result.insertId,
        insertId: result.insertId,
      };
    } catch (error) {
      console.error("Error en createClient del modelo:", error);
      throw error;
    }
  },

  async createMembershipContract({
    id_cliente,
    id_tipo_membresia,
    fecha_inicio,
    fecha_fin,
  }) {
    const [result] = await pool.query(
      `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin)
       VALUES (?, ?, ?, ?)`,
      [id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin]
    );
    return result.insertId;
  },

  async activateMembership({
    id_cliente,
    id_membresia,
    fecha_inicio,
    fecha_fin,
    precio_final,
  }) {
    const [result] = await pool.query(
      `INSERT INTO membresias_activas (id_cliente, id_membresia, fecha_inicio, fecha_fin, precio_final)
       VALUES (?, ?, ?, ?, ?)`,
      [id_cliente, id_membresia, fecha_inicio, fecha_fin, precio_final]
    );
    return result.insertId; // id_activa
  },

  async addFamilyMembers(id_activa, integrantes) {
    for (let integrante of integrantes) {
      // crear cliente para integrante
      const [result] = await pool.query(
        `INSERT INTO clientes (nombre_completo) VALUES (?)`,
        [integrante.nombre_completo]
      );
      const id_cliente_integrante = result.insertId;

      // registrar relación en integrantes_membresia
      await pool.query(
        `INSERT INTO integrantes_membresia (id_activa, id_cliente, id_relacion)
         VALUES (?, ?, ?)`,
        [id_activa, id_cliente_integrante, integrante.id_relacion || null]
      );
    }
  },

  async getTiposMembresia() {
    const [rows] = await pool.query(
      `SELECT id_tipo_membresia, nombre, precio, max_integrantes FROM tipos_membresia ORDER BY nombre`
    );
    return rows;
  },

  async getTipoMembresiaById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM tipos_membresia WHERE id_tipo_membresia = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async getMembresiasActivas() {
    const [rows] = await pool.query(`SELECT * FROM membresias_activas`);
    return rows;
  },
<<<<<<< HEAD

  // 🔽 NUEVOS MÉTODOS
  async getClienteById(id_cliente) {
    const [rows] = await pool.query(
      `SELECT id_cliente, nombre_completo, correo, telefono
       FROM clientes WHERE id_cliente = ?`,
      [id_cliente]
    );
    return rows[0] || null;
  },

  async getIntegrantesByActiva(id_activa) {
    const [rows] = await pool.query(
      `SELECT c.nombre_completo,
              im.id_relacion AS relacion
       FROM integrantes_membresia im
       JOIN clientes c ON c.id_cliente = im.id_cliente
       WHERE im.id_activa = ?`,
      [id_activa]
    );
    return rows; // [{nombre_completo, relacion}, ...]
  },
=======
>>>>>>> parent of 889367e (Generator QR)
};

export { MembershipModel };

