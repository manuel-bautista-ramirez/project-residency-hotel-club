import { pool } from "../../../dataBase/conecctionDataBase.js";

const MembershipModel = {
  async createClient({ nombre_completo, telefono, correo }) {
    try {
      console.log("Creando cliente con datos:", {
        nombre_completo,
        telefono,
        correo,
      });
      const [result] = await pool.query(
        `INSERT INTO clientes (nombre_completo, telefono, correo)
         VALUES (?, ?, ?)`,
        [nombre_completo, telefono, correo]
      );

      console.log("Resultado de la consulta SQL:", result);

      // Asegurarse de devolver el ID correctamente
      if (!result || (result.affectedRows === 0 && !result.insertId)) {
        throw new Error("No se pudo crear el cliente en la base de datos");
      }

      return {
        id_cliente: result.insertId,
        insertId: result.insertId, // Mantener compatibilidad
      };
    } catch (error) {
      console.error("Error en createClient del modelo:", error);
      throw error; // Re-lanzar el error para manejarlo en el controlador
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
    return result.insertId;
  },

  async addFamilyMembers(id_activa, integrantes) {
    for (let integrante of integrantes) {
      // Primero se crea el cliente del integrante
      const [result] = await pool.query(
        `INSERT INTO clientes (nombre_completo) VALUES (?)`,
        [integrante.nombre_completo]
      );
      const id_cliente_integrante = result.insertId;

      // Luego se registra como integrante de la membresía activa
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
  //Obtener todas las membresias activas
  async getMembresiasActivas() {
    const [rows] = await pool.query(`SELECT * FROM membresias_activas`);
    return rows;
  },
};

export { MembershipModel };
