import { pool } from "../../../dataBase/conecctionDataBase.js";

const MembershipModel = {
  async createClient({ name, phone, email }) {
    const [result] = await pool.query(
      `INSERT INTO clientes (nombre_completo, telefono, correo)
       VALUES (?, ?, ?)`,
      [name, phone, email]
    );
    return result.insertId; // id_cliente
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
    return result.insertId; // id_membresia
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

  // 👇 ahora agregamos integrantes (familiares)
  async addFamilyMembers(idActiva, integrantes) {
    const query = `
      INSERT INTO integrantes_membresia (id_activa, id_cliente, id_relacion)
      VALUES (?, ?, ?)
    `;
    for (let integrante of integrantes) {
      await pool.query(query, [
        idActiva,
        integrante.id_cliente, // este se crea antes si no existe
        integrante.id_relacion, // ej: padre, madre, hijo
      ]);
    }
  },

  async getTiposMembresia() {
    const [rows] = await pool.query(`
      SELECT id_tipo_membresia, nombre, precio, max_integrantes
      FROM tipos_membresia
      ORDER BY nombre
    `);
    return rows;
  },

  async getTipoMembresiaById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM tipos_membresia WHERE id_tipo_membresia = ?",
      [id]
    );
    return rows[0] || null;
  },

  async getRelacionesFamiliares() {
    const [rows] = await pool.query(
      `SELECT * FROM relaciones_familiares ORDER BY nombre`
    );
    return rows;
  },
};

export { MembershipModel };
