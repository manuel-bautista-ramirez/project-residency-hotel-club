import { pool } from "../../../dataBase/connectionDataBase.js";

// =====================================================
//            FUNCIONES DE PRODUCTOS
// =====================================================

// Obtener todos los productos
export const getAllProducts = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM productos 
      ORDER BY categoria, nombre
    `);
    return rows;
  } catch (error) {
    console.error("Error en getAllProducts:", error);
    throw error;
  }
};

// Obtener producto por ID
export const getProductById = async (id) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM productos WHERE id = ?
    `, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error("Error en getProductById:", error);
    throw error;
  }
};

// Crear producto
export const createProduct = async (productData) => {
  const { nombre, descripcion, categoria, precio, stock, imagen } = productData;
  try {
    const [result] = await pool.query(`
      INSERT INTO productos (nombre, descripcion, categoria, precio, stock, imagen)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nombre, descripcion, categoria, precio, stock, imagen || null]);
    return result.insertId;
  } catch (error) {
    console.error("Error en createProduct:", error);
    throw error;
  }
};

// Actualizar producto
export const updateProduct = async (id, productData) => {
  const { nombre, descripcion, categoria, precio, stock, imagen } = productData;
  try {
    const [result] = await pool.query(`
      UPDATE productos 
      SET nombre = ?, descripcion = ?, categoria = ?, precio = ?, stock = ?, imagen = ?
      WHERE id = ?
    `, [nombre, descripcion, categoria, precio, stock, imagen || null, id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error en updateProduct:", error);
    throw error;
  }
};

// Eliminar producto
export const deleteProduct = async (id) => {
  try {
    const [result] = await pool.query(`
      DELETE FROM productos WHERE id = ?
    `, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    throw error;
  }
};

// Actualizar stock de producto
export const updateProductStock = async (id, cantidad) => {
  try {
    const [result] = await pool.query(`
      UPDATE productos 
      SET stock = stock - ?
      WHERE id = ? AND stock >= ?
    `, [cantidad, id, cantidad]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error en updateProductStock:", error);
    throw error;
  }
};

// =====================================================
//            FUNCIONES DE VENTAS
// =====================================================

// Crear venta
export const createSale = async (saleData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { usuario_id, id_medio_mensaje, nombre_cliente, tipo_pago, total, total_letras, productos } = saleData;

    // Insertar venta
    const [saleResult] = await connection.query(`
      INSERT INTO ventas (usuario_id, id_medio_mensaje, nombre_cliente, tipo_pago, total, total_letras)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [usuario_id, id_medio_mensaje || null, nombre_cliente || null, tipo_pago, total, total_letras]);

    const ventaId = saleResult.insertId;

    // Insertar detalle de ventas y actualizar stock
    for (const producto of productos) {
      // Insertar detalle
      await connection.query(`
        INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [ventaId, producto.id, producto.cantidad, producto.precio, producto.subtotal]);

      // Actualizar stock
      const [updateResult] = await connection.query(`
        UPDATE productos 
        SET stock = stock - ?
        WHERE id = ? AND stock >= ?
      `, [producto.cantidad, producto.id, producto.cantidad]);

      if (updateResult.affectedRows === 0) {
        throw new Error(`Stock insuficiente para el producto ID: ${producto.id}`);
      }
    }

    await connection.commit();
    return ventaId;
  } catch (error) {
    await connection.rollback();
    console.error("Error en createSale:", error);
    throw error;
  } finally {
    connection.release();
  }
};

// Actualizar rutas de PDF y QR de venta
export const updateSalePaths = async (id, pdf_path, qr_path) => {
  try {
    const [result] = await pool.query(`
      UPDATE ventas 
      SET pdf_path = ?, qr_path = ?
      WHERE id = ?
    `, [pdf_path, qr_path, id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error en updateSalePaths:", error);
    throw error;
  }
};

// Obtener todas las ventas
export const getAllSales = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        v.id,
        v.nombre_cliente,
        v.fecha_venta,
        v.tipo_pago,
        v.total,
        v.pdf_path,
        v.qr_path,
        u.username AS usuario,
        COUNT(dv.id) AS total_productos
      FROM ventas v
      INNER JOIN users_hotel u ON v.usuario_id = u.id
      LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
      GROUP BY v.id
      ORDER BY v.fecha_venta DESC
    `);
    return rows;
  } catch (error) {
    console.error("Error en getAllSales:", error);
    throw error;
  }
};

// Obtener venta por ID con detalle
export const getSaleById = async (id) => {
  try {
    // Obtener venta
    const [venta] = await pool.query(`
      SELECT 
        v.*,
        u.username AS usuario,
        mm.correo_cliente,
        mm.telefono_cliente
      FROM ventas v
      INNER JOIN users_hotel u ON v.usuario_id = u.id
      LEFT JOIN medios_mensajes mm ON v.id_medio_mensaje = mm.id_medio_mensaje
      WHERE v.id = ?
    `, [id]);

    if (venta.length === 0) return null;

    // Obtener detalle
    const [detalle] = await pool.query(`
      SELECT 
        dv.*,
        p.nombre AS producto_nombre,
        p.categoria
      FROM detalle_ventas dv
      INNER JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
    `, [id]);

    return {
      ...venta[0],
      productos: detalle
    };
  } catch (error) {
    console.error("Error en getSaleById:", error);
    throw error;
  }
};

// Eliminar venta
export const deleteSale = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener detalle antes de eliminar para restaurar stock
    const [detalle] = await connection.query(`
      SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?
    `, [id]);

    // Restaurar stock
    for (const item of detalle) {
      await connection.query(`
        UPDATE productos SET stock = stock + ? WHERE id = ?
      `, [item.cantidad, item.producto_id]);
    }

    // Eliminar venta (el detalle se elimina automáticamente por CASCADE)
    const [result] = await connection.query(`
      DELETE FROM ventas WHERE id = ?
    `, [id]);

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    console.error("Error en deleteSale:", error);
    throw error;
  } finally {
    connection.release();
  }
};

// =====================================================
//            FUNCIONES DE REPORTES
// =====================================================

// Reporte de ventas por rango de fechas
export const getSalesReport = async (fechaInicio, fechaFin) => {
  try {
    const [ventas] = await pool.query(`
      SELECT 
        v.id,
        v.nombre_cliente,
        v.fecha_venta,
        v.tipo_pago,
        v.total,
        u.username AS usuario,
        COUNT(dv.id) AS total_productos
      FROM ventas v
      INNER JOIN users_hotel u ON v.usuario_id = u.id
      LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
      WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
      GROUP BY v.id
      ORDER BY v.fecha_venta DESC
    `, [fechaInicio, fechaFin]);

    // Calcular estadísticas
    const totalVentas = ventas.length;
    const totalIngresos = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    
    const ventasPorTipoPago = {
      efectivo: ventas.filter(v => v.tipo_pago === 'efectivo').reduce((sum, v) => sum + parseFloat(v.total), 0),
      transferencia: ventas.filter(v => v.tipo_pago === 'transferencia').reduce((sum, v) => sum + parseFloat(v.total), 0),
      tarjeta: ventas.filter(v => v.tipo_pago === 'tarjeta').reduce((sum, v) => sum + parseFloat(v.total), 0)
    };

    // Productos más vendidos
    const [productosMasVendidos] = await pool.query(`
      SELECT 
        p.nombre,
        p.categoria,
        SUM(dv.cantidad) AS total_vendido,
        SUM(dv.subtotal) AS total_ingresos
      FROM detalle_ventas dv
      INNER JOIN productos p ON dv.producto_id = p.id
      INNER JOIN ventas v ON dv.venta_id = v.id
      WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY total_vendido DESC
      LIMIT 10
    `, [fechaInicio, fechaFin]);

    return {
      tipo: 'ventas',
      fechaInicio,
      fechaFin,
      datos: ventas,
      estadisticas: {
        totalVentas,
        totalIngresos,
        promedioVenta: totalVentas > 0 ? totalIngresos / totalVentas : 0,
        ventasPorTipoPago
      },
      productosMasVendidos
    };
  } catch (error) {
    console.error("Error en getSalesReport:", error);
    throw error;
  }
};
