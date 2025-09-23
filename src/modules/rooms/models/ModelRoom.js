// src/modules/rooms/models/ModelRoom.js
import { pool } from "../../../dataBase/conecctionDataBase.js"; // conexión MySQL

//  get all habitations created
export const getHabitaciones = async () => {
  try {
    const [rows] = await pool.query("SELECT * FROM habitaciones");
    return rows; // devolvemos directamente las filas
  } catch (err) {
    console.error("Error getHabitaciones:", err);
    return [];
  }
};

// get all reservationes created
export const getAllReservationes = async () => {
  const [rows] = await pool.query(`
    SELECT r.id AS id_reservacion,
        h.numero AS numero_habitacion,
        h.estado,
        r.nombre_cliente,
        r.fecha_reserva,
        r.fecha_ingreso,
        r.fecha_salida,
        r.monto
    FROM reservaciones r
    INNER JOIN habitaciones h ON r.habitacion_id = h.id
    ORDER BY r.fecha_ingreso DESC
  `);
  return rows;
};

// get all rentas created
export const getAllRentas = async ()=>{
  const [rows] = await pool.query(`
    SELECT re.id AS id_renta,
           h.numero AS numero_habitacion,
           h.estado,
           re.nombre_cliente,
           re.fecha_ingreso,
           re.fecha_salida,
           re.tipo_pago,
           re.monto,
           re.monto_letras
    FROM rentas re
    INNER JOIN habitaciones h ON re.habitacion_id = h.id
    ORDER BY re.fecha_ingreso DESC
  `);
  return rows;
}

// Editar one  Reservation by Id
export const findReservacionById = async (id) => {
  try {
    const query = `
    SELECT res.id, res.nombre_cliente, res.fecha_reserva, res.fecha_ingreso, res.fecha_salida,
          res.monto, res.monto_letras,
          h.id AS habitacion_id, h.numero AS habitacion_numero, h.tipo AS habitacion_tipo,
          m.correo_cliente, m.telefono_cliente
    FROM reservaciones res
    JOIN habitaciones h ON res.habitacion_id = h.id
    JOIN medios_mensajes m ON res.id_medio_mensaje = m.id_medio_mensaje
    WHERE res.id = ?
  `;
    const [rows] = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("Error findReservacionById:", err);
    return null;
  }
};

// update use status of resevation
export const updateStatus = async () => {};

/**
 * Crear una nueva renta
 */

export const crearRenta = async (req, res) => {
  try {
    const {
      habitacion_id,
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso,
      fecha_salida,
      tipo_pago,
    } = req.body;

    const usuario_id = req.session.user.id; // usuario que crea la renta

    // 1️⃣ Insertar el medio de contacto
    const [medioResult] = await pool.query(
      `INSERT INTO medios_mensajes (correo_cliente, telefono_cliente)
       VALUES (?, ?)`,
      [correo, telefono]
    );
    const id_medio_mensaje = medioResult.insertId;

    // 2️⃣ Obtener tipo de habitación para calcular monto
    const [habitacionRows] = await pool.query(
      `SELECT tipo FROM habitaciones WHERE id = ?`,
      [habitacion_id]
    );
    if (habitacionRows.length === 0) {
      return res.status(404).send("Habitación no encontrada");
    }
    const tipo_habitacion = habitacionRows[0].tipo;

    // 3️⃣ Calcular el monto según la tabla de precios y el mes de ingreso
    const mes = new Date(fecha_ingreso).getMonth() + 1; // getMonth() devuelve 0-11
    const [precioRows] = await pool.query(
      `SELECT monto FROM precios WHERE tipo_habitacion = ? AND mes = ?`,
      [tipo_habitacion, mes]
    );

    if (precioRows.length === 0) {
      return res
        .status(400)
        .send("No hay precio configurado para esta habitación y mes");
    }

    const monto = precioRows[0].monto;
    const monto_letras = numeroALetras(monto); // convierte número a letras

    // 4️⃣ Insertar la renta
    const [rentaResult] = await pool.query(
      `INSERT INTO reservaciones
       (habitacion_id, usuario_id, id_medio_mensaje, nombre_cliente, fecha_reserva,
        fecha_ingreso, fecha_salida, monto, monto_letras, tipo_pago)
       VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
      [
        habitacion_id,
        usuario_id,
        id_medio_mensaje,
        nombre_cliente,
        fecha_ingreso,
        fecha_salida,
        monto,
        monto_letras,
        tipo_pago,
      ]
    );

    // 5️⃣ Redirigir al detalle de la renta
    return res.redirect(`/rentas/${rentaResult.insertId}/detalle`);
  } catch (err) {
    console.error("Error en crearRenta:", err);
    return res.status(500).send("Error al crear la renta");
  }
};

/** Helpers **/
// const nextId = (arr) => (!arr.length ? 1 : Math.max(...arr.map(x => Number(x.id))) + 1);
// const numeroALetras = (num) =>
//   new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(num);

// /** Datos simulados **/

// --- Base de datos ---
//  export const getEventosCalendario = async () => {
//   try {
//     const query = `
//       SELECT r.id, r.nombre_cliente, m.correo_cliente, m.telefono_cliente, r.fecha_ingreso, r.fecha_salida, 'renta' AS tipo
//       FROM rentas r
//       INNER JOIN medios_mensajes m ON r.id_medio_mensaje = m.id_medio_mensaje
//       UNION ALL
//       SELECT res.id, res.nombre_cliente, m.correo_cliente, m.telefono_cliente, res.fecha_ingreso, res.fecha_salida, 'reserva' AS tipo
//       FROM reservaciones res
//       INNER JOIN medios_mensajes m ON res.id_medio_mensaje = m.id_medio_mensaje
//     `;
//     const [rows] = await pool.execute(query);
//     return rows.map(evento => ({
//       id: evento.id,
//       title: evento.nombre_cliente,
//       start: evento.fecha_ingreso,
//       end: evento.fecha_salida ? new Date(new Date(evento.fecha_salida).getTime() + 24*60*60*1000).toISOString().split('T')[0] : evento.fecha_salida,
//       tipo: evento.tipo,
//       correo: evento.correo_cliente,
//       telefono: evento.telefono_cliente
//     }));
//   } catch (err) {
//     console.error("Error getEventosCalendario:", err);
//     return [];
//   }
// }
