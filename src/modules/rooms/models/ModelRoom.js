// src/modules/rooms/models/ModelRoom.js
import { pool } from "../../../dataBase/connectionDataBase.js"; // conexión MySQL

//  get all habitations created
export const getHabitaciones = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT
        h.*,
        CASE
          -- Si hay una renta activa HOY, está ocupada
          WHEN EXISTS (
            SELECT 1 FROM rentas re
            WHERE re.habitacion_id = h.id
            AND CURDATE() BETWEEN DATE(re.fecha_ingreso) AND DATE(re.fecha_salida)
          ) THEN 'ocupado'

          -- Si hay una reservación activa HOY, está ocupada
          WHEN EXISTS (
            SELECT 1 FROM reservaciones r
            WHERE r.habitacion_id = h.id
            AND CURDATE() BETWEEN DATE(r.fecha_ingreso) AND DATE(r.fecha_salida)
          ) THEN 'ocupado'

          -- Si el estado fue cambiado manualmente a disponible, respetarlo
          WHEN h.estado = 'disponible' THEN 'disponible'

          -- Si una renta ya venció (fecha_salida pasó), automáticamente pasa a limpieza
          WHEN EXISTS (
            SELECT 1 FROM rentas re
            WHERE re.habitacion_id = h.id
            AND DATE(re.fecha_salida) < CURDATE()
          ) THEN 'limpieza'

          -- Si una reservación ya venció (fecha_salida pasó), automáticamente pasa a limpieza
          WHEN EXISTS (
            SELECT 1 FROM reservaciones r
            WHERE r.habitacion_id = h.id
            AND DATE(r.fecha_salida) < CURDATE()
          ) THEN 'limpieza'

          -- Si el estado manual es limpieza, mantener limpieza
          WHEN h.estado = 'limpieza' THEN 'limpieza'

          -- De lo contrario, está disponible
          ELSE 'disponible'
        END AS estado_real
      FROM habitaciones h
    `);

    // Mapear el estado_real al campo estado para mantener compatibilidad
    return rows.map(row => ({
      ...row,
      estado: row.estado_real
    }));
  } catch (err) {
    console.error("Error getHabitaciones:", err);
    return [];
  }
};

// Verificar disponibilidad de habitación en un rango de fechas
export const checkRoomAvailability = async (roomId, fechaIngreso, fechaSalida, excludeReservationId = null, excludeRentId = null) => {
  try {
    console.log('\n🔍 === VERIFICANDO DISPONIBILIDAD ===');
    console.log('📅 Habitación ID:', roomId);
    console.log('📅 Fecha Ingreso:', fechaIngreso);
    console.log('📅 Fecha Salida:', fechaSalida);
    console.log('📅 Excluir Reservación ID:', excludeReservationId);
    console.log('📅 Excluir Renta ID:', excludeRentId);

    const query = `
      SELECT
        (
          -- Verificar si hay rentas en conflicto
          (SELECT COUNT(*)
           FROM rentas
           WHERE habitacion_id = ?
           AND (? < fecha_salida AND ? > fecha_ingreso)
           ${excludeRentId ? 'AND id != ?' : ''}
          ) +
          -- Verificar si hay reservaciones en conflicto
          (SELECT COUNT(*)
           FROM reservaciones
           WHERE habitacion_id = ?
           AND (? < fecha_salida AND ? > fecha_ingreso)
           ${excludeReservationId ? 'AND id != ?' : ''}
          )
        ) AS conflicts
    `;

    const params = [roomId, fechaIngreso, fechaSalida];
    if (excludeRentId) params.push(excludeRentId);
    params.push(roomId, fechaIngreso, fechaSalida);
    if (excludeReservationId) params.push(excludeReservationId);

    console.log('📤 Parámetros de consulta:', params);

    const [rows] = await pool.query(query, params);
    const isAvailable = rows[0].conflicts === 0;
    
    console.log('🔢 Conflictos encontrados:', rows[0].conflicts);
    console.log('✅ Disponible:', isAvailable);
    console.log('=== FIN VERIFICACIÓN ===\n');
    
    return isAvailable; // true si está disponible, false si hay conflictos
  } catch (err) {
    console.error('Error checkRoomAvailability:', err);
    return false;
  }
};

// change room status
export const updateRoomStatus = async (roomId, newStatus) => {
  try {
    const [result] = await pool.query(
      "UPDATE habitaciones SET estado = ? WHERE id = ?",
      [newStatus, roomId]
    );
    return result.affectedRows > 0;
  } catch (err) {
    console.error("Error updating room status:", err);
    return false;
  }
};

// create a new reservation
export const createReservation = async (reservationData) => {
  const {
    habitacion_id,
    usuario_id,
    nombre_cliente,
    correo,
    telefono,
    fecha_ingreso,
    fecha_salida,
    monto,
    monto_letras,
    enganche,
    enganche_letras,
  } = reservationData;
  const usuarioIdInt = Number(usuario_id);
  try {
    // 0. Verificar disponibilidad de la habitación
    const isAvailable = await checkRoomAvailability(habitacion_id, fecha_ingreso, fecha_salida);
    if (!isAvailable) {
      throw new Error('La habitación no está disponible para las fechas seleccionadas');
    }

    // 1. Insertar el medio de mensaje
    const [medioResult] = await pool.query(
      `INSERT INTO medios_mensajes (correo_cliente, telefono_cliente) VALUES (?, ?)`,
      [correo, telefono]
    );
    const id_medio_mensaje = medioResult.insertId;

    // 2. Insertar la reservación
    const engancheAmount = enganche || 0;
    const engancheText = enganche_letras || '';
    
    const [result] = await pool.query(
      `INSERT INTO reservaciones
       (habitacion_id, usuario_id, id_medio_mensaje, nombre_cliente, fecha_reserva, fecha_ingreso, fecha_salida, monto, monto_letras, enganche, enganche_letras)
        VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
      [
        habitacion_id,
        usuarioIdInt,
        id_medio_mensaje,
        nombre_cliente,
        fecha_ingreso,
        fecha_salida,
        monto,
        monto_letras,
        engancheAmount,
        engancheText,
      ]
    );

    // 3. Cambiar el estado de la habitación a "ocupado" solo si el check-in ya pasó
    const checkInDate = new Date(fecha_ingreso);
    const now = new Date();
    
    if (checkInDate <= now) {
      console.log('🏠 Actualizando estado de habitación a "ocupado" (check-in ya pasó)');
      await pool.query(
        "UPDATE habitaciones SET estado = 'ocupado' WHERE id = ?",
        [habitacion_id]
      );
    } else {
      console.log('📅 Check-in es futuro, estado de habitación no se cambia aún');
    }

    return result.insertId;
  } catch (err) {
    console.error("Error createReservation:", err);
    throw err; // Propagar el error para manejarlo en el controlador
  }
};

// get all reservationes created
export const getAllReservationes = async () => {
  const [rows] = await pool.query(`
    SELECT r.id AS id_reservacion,
        h.numero AS numero_habitacion,
        h.estado,
        r.nombre_cliente,
        mm.correo_cliente AS correo,
        mm.telefono_cliente AS telefono,
        r.habitacion_id,
        r.fecha_registro AS fecha_reserva,
        r.fecha_ingreso,
        r.fecha_salida,
        r.monto AS precio_total,
        'Pendiente' AS tipo_pago,
        r.fecha_registro AS fecha_creacion
    FROM reservaciones r
    INNER JOIN habitaciones h ON r.habitacion_id = h.id
    INNER JOIN medios_mensajes mm ON r.id_medio_mensaje = mm.id_medio_mensaje
    ORDER BY r.fecha_ingreso DESC
  `);
  return rows;
};

// delete by id reservation
export const deletebyReservation = async (id) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM reservaciones WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  } catch (err) {
    console.error("Error deleting reservation:", err);
    return false;
  }
};

// get all rentas created
export const getAllRentas = async () => {
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
};

// get room number by room id
export const getRoomNumberById = async (roomId) => {
  try {
    const [rows] = await pool.query(`
      SELECT numero FROM habitaciones WHERE id = ?
    `, [roomId]);
    return rows.length > 0 ? rows[0].numero : null;
  } catch (error) {
    console.error('Error getting room number:', error);
    return null;
  }
};

// delete by id renta
export const deleteByIdRenta = async (id) => {
  try {
    const [result] = await pool.query("DELETE FROM rentas WHERE id = ?", [id]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error("Error deleting renta:", err);
    return false;
  }
};

// Edit one  Reservation by Id
export const findReservacionById = async (id) => {
  try {
    const query = `
    SELECT res.id, res.nombre_cliente, res.fecha_reserva, res.fecha_ingreso, res.fecha_salida,
          res.monto, res.monto_letras, res.pdf_path, res.qr_path,
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

// Update Reservation
export const updateReservation = async (id, reservationData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      nombre_cliente,
      fecha_ingreso,
      fecha_salida,
      habitacion_id,
      monto,
      monto_letras,
      pdf_path,
      qr_path,
    } = reservationData;

    // Construir query dinámicamente según los campos proporcionados
    let updateFields = [];
    let updateValues = [];

    if (nombre_cliente !== undefined) {
      updateFields.push('nombre_cliente = ?');
      updateValues.push(nombre_cliente);
    }
    if (fecha_ingreso !== undefined) {
      updateFields.push('fecha_ingreso = ?');
      updateValues.push(fecha_ingreso);
    }
    if (fecha_salida !== undefined) {
      updateFields.push('fecha_salida = ?');
      updateValues.push(fecha_salida);
    }
    if (habitacion_id !== undefined) {
      updateFields.push('habitacion_id = ?');
      updateValues.push(habitacion_id);
    }
    if (monto !== undefined) {
      updateFields.push('monto = ?');
      updateValues.push(monto);
    }
    if (monto_letras !== undefined) {
      updateFields.push('monto_letras = ?');
      updateValues.push(monto_letras);
    }
    if (pdf_path !== undefined) {
      updateFields.push('pdf_path = ?');
      updateValues.push(pdf_path);
    }
    if (qr_path !== undefined) {
      updateFields.push('qr_path = ?');
      updateValues.push(qr_path);
    }

    updateValues.push(id);

    const updateReservacionQuery = `
      UPDATE reservaciones 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await connection.query(updateReservacionQuery, updateValues);

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    console.error("Error updateReservation:", err);
    throw err;
  } finally {
    connection.release();
  }
};

// get price by type and month
export const getPrecioPorTipoYMes = async (tipo_habitacion, mes) => {
  const [rows] = await pool.query(
    "SELECT monto FROM precios WHERE tipo_habitacion = ? AND mes = ?",
    [tipo_habitacion, mes]
  );
  return rows.length ? rows[0].monto : null;
};

// create a new renta
export const createRenta = async (req, res) => {
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

// get all Prices
export const getAllPrices = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT
        mes,
        MAX(CASE WHEN tipo_habitacion = 'sencilla' THEN monto END) AS sencilla,
        MAX(CASE WHEN tipo_habitacion = 'suite' THEN monto END) AS suite
      FROM precios
      GROUP BY mes
      ORDER BY mes
    `);
    return rows;
  } catch (error) {
    console.error("Error getAllPrices:", error);
    return [];
  }
};

// set new price
export const setNewPrice = async (priceData) => {
  const { tipo_habitacion, mes, monto } = priceData;
  try {
    const [result] = await pool.query(
      `INSERT INTO precios (tipo_habitacion, mes, monto)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE monto = ?`,
      [tipo_habitacion, mes, monto, monto]
    );
    return { id: result.insertId, ...priceData };
  } catch (err) {
    console.error("Error setNewPrice:", err);
    return null;
  }
};

//  funciones de  asrconas  para vericar el estado  de disponibilidad  de las habitaciones y precios segun el mes.
// Obtener precio por tipo y mes
export const getRoomPriceByTypeAndMonth = async (roomType, month) => {
  try {
    const [rows] = await pool.query(
      "SELECT monto FROM precios WHERE tipo_habitacion = ? AND mes = ?",
      [roomType, month]
    );
    return rows.length ? rows[0].monto : null;
  } catch (err) {
    console.error("Error getRoomPriceByTypeAndMonth:", err);
    return null;
  }
};

// Insert a messaging method and return the generated ID
export const createMessageMethod = async (email, phone) => {
  const [result] = await pool.query(
    `INSERT INTO medios_mensajes (correo_cliente, telefono_cliente) VALUES (?, ?)`,
    [email, phone]
  );
  return result.insertId;
};

// Insert a rent using the messaging method ID
export const createRent = async ({
  room_id,
  user_id,
  message_method_id,
  client_name,
  check_in_date,
  check_out_date,
  payment_type,
  amount,
  amount_text,
}) => {
  console.log('\n🔍 === DEPURACIÓN createRent (MODEL) ===');
  console.log('📥 Fechas recibidas en el modelo:');
  console.log('  - check_in_date:', check_in_date, typeof check_in_date);
  console.log('  - check_out_date:', check_out_date, typeof check_out_date);
  console.log('  - message_method_id:', message_method_id);

  // 0. Verificar disponibilidad de la habitación
  const isAvailable = await checkRoomAvailability(room_id, check_in_date, check_out_date);
  if (!isAvailable) {
    throw new Error('La habitación no está disponible para las fechas seleccionadas');
  }

  // 2. Insertar la renta
  const params = [
    room_id,
    user_id,
    message_method_id,
    client_name,
    check_in_date,
    check_out_date,
    payment_type,
    amount,
    amount_text,
  ];

  console.log('📤 Parámetros que se enviarán a MySQL:', params);
  console.log('=== FIN DEPURACIÓN createRent ===\n');

  const [result] = await pool.query(
    `INSERT INTO rentas (
      habitacion_id, usuario_id, id_medio_mensaje,
      nombre_cliente, fecha_ingreso, fecha_salida,
      tipo_pago, monto, monto_letras
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params
  );

  // 3. Actualizar estado de la habitación si el check-in es hoy y ya pasó la hora
  const checkInDate = new Date(check_in_date);
  const now = new Date();
  
  // Si la fecha de check-in es hoy o ya pasó, cambiar estado a "ocupado"
  if (checkInDate <= now) {
    console.log('🏠 Actualizando estado de habitación a "ocupado" (check-in ya pasó)');
    await pool.query(
      "UPDATE habitaciones SET estado = 'ocupado' WHERE id = ?",
      [room_id]
    );
  } else {
    console.log('📅 Check-in es futuro, estado de habitación no se cambia aún');
  }

  return result.insertId;
};

// Update Rent
export const updateRent = async (id, rentData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      nombre_cliente,
      fecha_ingreso,
      fecha_salida,
      habitacion_id,
      tipo_pago,
      monto,
      monto_letras,
      pdf_path,
      qr_path,
    } = rentData;

    // Construir query dinámicamente según los campos proporcionados
    let updateFields = [];
    let updateValues = [];

    if (nombre_cliente !== undefined) {
      updateFields.push('nombre_cliente = ?');
      updateValues.push(nombre_cliente);
    }
    if (fecha_ingreso !== undefined) {
      updateFields.push('fecha_ingreso = ?');
      updateValues.push(fecha_ingreso);
    }
    if (fecha_salida !== undefined) {
      updateFields.push('fecha_salida = ?');
      updateValues.push(fecha_salida);
    }
    if (habitacion_id !== undefined) {
      updateFields.push('habitacion_id = ?');
      updateValues.push(habitacion_id);
    }
    if (tipo_pago !== undefined) {
      updateFields.push('tipo_pago = ?');
      updateValues.push(tipo_pago);
    }
    if (monto !== undefined) {
      updateFields.push('monto = ?');
      updateValues.push(monto);
    }
    if (monto_letras !== undefined) {
      updateFields.push('monto_letras = ?');
      updateValues.push(monto_letras);
    }
    if (pdf_path !== undefined) {
      updateFields.push('pdf_path = ?');
      updateValues.push(pdf_path);
    }
    if (qr_path !== undefined) {
      updateFields.push('qr_path = ?');
      updateValues.push(qr_path);
    }

    updateValues.push(id);

    const updateRentQuery = `
      UPDATE rentas 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await connection.query(updateRentQuery, updateValues);

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    console.error("Error updateRent:", err);
    throw err;
  } finally {
    connection.release();
  }
};

/** Helpers **/

// ===== FUNCIONES PARA REPORTES =====

// Reporte de rentas por rango de fechas
export const getReporteRentas = async (fechaInicio, fechaFin, filtros = {}) => {
  try {
    let query = `
      SELECT 
        r.id_renta,
        r.nombre_cliente,
        h.numero AS numero_habitacion,
        h.tipo AS tipo_habitacion,
        r.fecha_ingreso,
        r.fecha_salida,
        r.tipo_pago,
        r.monto,
        r.monto_letras,
        mm.correo_cliente,
        mm.telefono_cliente
      FROM rentas r
      INNER JOIN habitaciones h ON r.habitacion_id = h.id
      LEFT JOIN medios_mensajes mm ON r.id_medio_mensaje = mm.id_medio_mensaje
      WHERE DATE(r.fecha_ingreso) BETWEEN ? AND ?
    `;
    
    const params = [fechaInicio, fechaFin];
    
    // Aplicar filtros opcionales
    if (filtros.habitacion) {
      query += ` AND h.numero = ?`;
      params.push(filtros.habitacion);
    }
    if (filtros.cliente) {
      query += ` AND r.nombre_cliente LIKE ?`;
      params.push(`%${filtros.cliente}%`);
    }
    if (filtros.tipoPago) {
      query += ` AND r.tipo_pago = ?`;
      params.push(filtros.tipoPago);
    }
    
    query += ` ORDER BY r.fecha_ingreso DESC`;
    
    const [rentas] = await pool.query(query, params);
    
    // Calcular estadísticas
    const totalRentas = rentas.length;
    const totalIngresos = rentas.reduce((sum, r) => sum + Number(r.monto), 0);
    const promedioIngreso = totalRentas > 0 ? totalIngresos / totalRentas : 0;
    
    return {
      tipo: 'rentas',
      fechaInicio,
      fechaFin,
      datos: rentas,
      estadisticas: {
        totalRentas,
        totalIngresos,
        promedioIngreso
      }
    };
  } catch (err) {
    console.error("Error en getReporteRentas:", err);
    throw err;
  }
};

// Reporte de reservaciones por rango de fechas
export const getReporteReservaciones = async (fechaInicio, fechaFin, filtros = {}) => {
  try {
    let query = `
      SELECT 
        r.id,
        r.nombre_cliente,
        h.numero AS numero_habitacion,
        h.tipo AS tipo_habitacion,
        r.fecha_ingreso,
        r.fecha_salida,
        r.monto,
        r.enganche,
        mm.correo_cliente,
        mm.telefono_cliente
      FROM reservaciones r
      INNER JOIN habitaciones h ON r.habitacion_id = h.id
      LEFT JOIN medios_mensajes mm ON r.id_medio_mensaje = mm.id_medio_mensaje
      WHERE DATE(r.fecha_ingreso) BETWEEN ? AND ?
    `;
    
    const params = [fechaInicio, fechaFin];
    
    // Aplicar filtros opcionales
    if (filtros.habitacion) {
      query += ` AND h.numero = ?`;
      params.push(filtros.habitacion);
    }
    if (filtros.cliente) {
      query += ` AND r.nombre_cliente LIKE ?`;
      params.push(`%${filtros.cliente}%`);
    }
    
    query += ` ORDER BY r.fecha_ingreso DESC`;
    
    const [reservaciones] = await pool.query(query, params);
    
    // Calcular estadísticas
    const totalReservaciones = reservaciones.length;
    const totalMontoEsperado = reservaciones.reduce((sum, r) => sum + Number(r.monto), 0);
    const totalEnganche = reservaciones.reduce((sum, r) => sum + Number(r.enganche || 0), 0);
    
    return {
      tipo: 'reservaciones',
      fechaInicio,
      fechaFin,
      datos: reservaciones,
      estadisticas: {
        totalReservaciones,
        totalMontoEsperado,
        totalEnganche,
        pendientePorCobrar: totalMontoEsperado - totalEnganche
      }
    };
  } catch (err) {
    console.error("Error en getReporteReservaciones:", err);
    throw err;
  }
};

// Reporte consolidado (rentas + reservaciones)
export const getReporteConsolidado = async (fechaInicio, fechaFin, filtros = {}) => {
  try {
    const reporteRentas = await getReporteRentas(fechaInicio, fechaFin, filtros);
    const reporteReservaciones = await getReporteReservaciones(fechaInicio, fechaFin, filtros);
    
    return {
      tipo: 'consolidado',
      fechaInicio,
      fechaFin,
      rentas: reporteRentas,
      reservaciones: reporteReservaciones,
      estadisticas: {
        totalOperaciones: reporteRentas.estadisticas.totalRentas + reporteReservaciones.estadisticas.totalReservaciones,
        ingresosReales: reporteRentas.estadisticas.totalIngresos,
        ingresosEsperados: reporteReservaciones.estadisticas.totalMontoEsperado,
        totalGeneral: reporteRentas.estadisticas.totalIngresos + reporteReservaciones.estadisticas.totalMontoEsperado
      }
    };
  } catch (err) {
    console.error("Error en getReporteConsolidado:", err);
    throw err;
  }
};

// Obtener datos del calendario con rentas y reservaciones por habitación
export const getRoomsCalendarData = async () => {
  try {
    // Obtener todas las habitaciones
    const rooms = await getHabitaciones();
    
    console.log(`📊 Total habitaciones en modelo: ${rooms.length}`);

    // Para cada habitación, obtener sus rentas y reservaciones
    const roomsWithBookings = await Promise.all(
      rooms.map(async (room) => {
        // Obtener rentas
        const [rentas] = await pool.query(
          `SELECT r.*, mm.correo_cliente, mm.telefono_cliente
           FROM rentas r
           LEFT JOIN medios_mensajes mm ON r.id_medio_mensaje = mm.id_medio_mensaje
           WHERE r.habitacion_id = ?
           ORDER BY r.fecha_ingreso`,
          [room.id]
        );

        // Obtener reservaciones
        const [reservaciones] = await pool.query(
          `SELECT r.*, mm.correo_cliente, mm.telefono_cliente
           FROM reservaciones r
           LEFT JOIN medios_mensajes mm ON r.id_medio_mensaje = mm.id_medio_mensaje
           WHERE r.habitacion_id = ?
           ORDER BY r.fecha_ingreso`,
          [room.id]
        );

        if (rentas.length > 0 || reservaciones.length > 0) {
          console.log(`🏠 Habitación ${room.numero}:`, {
            rentas: rentas.length,
            reservaciones: reservaciones.length
          });
        }

        return {
          id: room.id,
          numero: room.numero,
          tipo: room.tipo,
          estado: room.estado,
          rentas: rentas,
          reservaciones: reservaciones,
        };
      })
    );

    return roomsWithBookings;
  } catch (err) {
    console.error("❌ Error en getRoomsCalendarData:", err);
    throw err;
  }
};
