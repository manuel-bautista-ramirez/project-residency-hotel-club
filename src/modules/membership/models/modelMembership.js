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
    // SIMPLIFICADO: Solo insertar nombres en integrantes_membresia
    for (let integrante of integrantes) {
      await pool.query(
        `INSERT INTO integrantes_membresia (id_activa, nombre_completo)
         VALUES (?, ?)`,
        [id_activa, integrante.nombre_completo]
      );
    }
  },

  async getTiposMembresia() {
    const [rows] = await pool.query(
      `SELECT id_tipo_membresia, nombre, precio, max_integrantes 
       FROM tipos_membresia 
       ORDER BY nombre`
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
    const [rows] = await pool.query(`
      SELECT ma.*, 
             c.nombre_completo as nombre_cliente,
             tm.nombre as tipo_membresia
      FROM membresias_activas ma
      JOIN clientes c ON c.id_cliente = ma.id_cliente
      JOIN tipos_membresia tm ON tm.id_tipo_membresia = (
        SELECT m.id_tipo_membresia 
        FROM membresias m 
        WHERE m.id_membresia = ma.id_membresia
      )
    `);
    return rows;
  },

  async getClienteById(id_cliente) {
    const [rows] = await pool.query(
      `SELECT id_cliente, nombre_completo, correo, telefono
       FROM clientes WHERE id_cliente = ?`,
      [id_cliente]
    );
    return rows[0] || null;
  },

  async getIntegrantesByActiva(id_activa) {
    // SIMPLIFICADO: Solo obtener nombres de la tabla integrantes_membresia
    const [rows] = await pool.query(
      `SELECT nombre_completo
       FROM integrantes_membresia 
       WHERE id_activa = ?`,
      [id_activa]
    );
    return rows; // [{nombre_completo}, ...]
  },

  // 🔽 NUEVOS MÉTODOS PARA LA ESTRUCTURA SIMPLIFICADA

  async recordPayment({ id_activa, id_metodo_pago, monto }) {
    const [result] = await pool.query(
      `INSERT INTO pagos (id_activa, id_metodo_pago, monto)
       VALUES (?, ?, ?)`,
      [id_activa, id_metodo_pago, monto]
    );
    return result.insertId;
  },

  async getMetodosPago() {
    const [rows] = await pool.query(
      `SELECT id_metodo_pago, nombre FROM metodos_pago ORDER BY nombre`
    );
    return rows;
  },

  async getMembresiaCompleta(id_activa) {
    const [rows] = await pool.query(
      `
      SELECT 
        ma.*,
        c.nombre_completo as nombre_cliente,
        c.correo,
        c.telefono,
        tm.nombre as tipo_membresia,
        tm.max_integrantes,
        (SELECT COUNT(*) FROM integrantes_membresia im WHERE im.id_activa = ma.id_activa) as total_integrantes
      FROM membresias_activas ma
      JOIN clientes c ON c.id_cliente = ma.id_cliente
      JOIN membresias m ON m.id_membresia = ma.id_membresia
      JOIN tipos_membresia tm ON tm.id_tipo_membresia = m.id_tipo_membresia
      WHERE ma.id_activa = ?
    `,
      [id_activa]
    );

    return rows[0] || null;
  },

  async getPagosByMembresia(id_activa) {
    const [rows] = await pool.query(
      `
      SELECT p.*, mp.nombre as metodo_pago
      FROM pagos p
      JOIN metodos_pago mp ON mp.id_metodo_pago = p.id_metodo_pago
      WHERE p.id_activa = ?
      ORDER BY p.fecha_pago DESC
    `,
      [id_activa]
    );

    return rows;
  },

  async updateEstadoMembresia(id_activa, nuevo_estado) {
    const [result] = await pool.query(
      `UPDATE membresias_activas SET estado = ? WHERE id_activa = ?`,
      [nuevo_estado, id_activa]
    );
    return result.affectedRows > 0;
  },

  async getPrecioFamiliar() {
    // Obtener el precio de membresía familiar
    const [rows] = await pool.query(
      `SELECT precio FROM tipos_membresia WHERE nombre = 'Familiar'`
    );
    return rows[0]?.precio || 1200.0;
  },

  async getMembresiaById(id) {
    try {
      const [membresias] = await pool.query(
        `SELECT 
          ma.id_activa,
          ma.id_cliente,
          ma.id_membresia,
          ma.fecha_inicio,
          ma.fecha_fin,
          ma.precio_final,
          ma.estado,
          c.nombre_completo,
          c.telefono,
          c.correo,
          tm.nombre as tipo_membresia,
          tm.max_integrantes,
          tm.precio,
          DATEDIFF(ma.fecha_fin, CURDATE()) as dias_restantes,
          CASE 
            WHEN tm.max_integrantes > 1 THEN 'Familiar'
            ELSE 'Individual'
          END as tipo
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.id_activa = ?`,
        [id]
      );

      if (membresias.length === 0) {
        return null;
      }

      const membresia = membresias[0];
      
      // Si es una membresía familiar, obtener los integrantes
      if (membresia.max_integrantes > 1) {
        membresia.integrantes = await this.getIntegrantesByActiva(id);
      } else {
        membresia.integrantes = [];
      }

      return membresia;
    } catch (error) {
      console.error("Error en getMembresiaById:", error);
      throw error;
    }
  },

};

export { MembershipModel };
