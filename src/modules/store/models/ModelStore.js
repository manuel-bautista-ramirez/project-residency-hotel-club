import { pool } from "../../../dataBase/connectionDataBase.js";

// =====================================================
//            FUNCIONES DE PRODUCTOS
// =====================================================

// Obtener todos los productos
export const getAllProducts = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM productos
      WHERE activo = 1
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
      UPDATE productos SET activo = 0 WHERE id = ?
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

// Añadir stock a un producto
export const addStockToProduct = async (id, quantityToAdd) => {
  try {
    const [result] = await pool.query(`
      UPDATE productos
      SET stock = stock + ?
      WHERE id = ?
    `, [quantityToAdd, id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error en addStockToProduct:", error);
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

    // Insertar detalles de venta
    for (const producto of productos) {
      // Insertar detalles
      await connection.query(`
        INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal)
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
        v.created_at AS fecha_venta,
        v.tipo_pago,
        v.total,
        v.pdf_path,
        v.qr_path,
        u.username AS usuario,
        COUNT(dv.id) AS total_productos
      FROM ventas v
      LEFT JOIN users_hotel u ON v.usuario_id = u.id
      LEFT JOIN venta_detalles dv ON v.id = dv.venta_id
      GROUP BY v.id
      ORDER BY v.created_at DESC
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
        v.created_at as fecha_venta,
        u.username AS usuario,
        mm.correo_cliente,
        mm.telefono_cliente
      FROM ventas v
      LEFT JOIN users_hotel u ON v.usuario_id = u.id
      LEFT JOIN medios_mensajes mm ON v.id_medio_mensaje = mm.id_medio_mensaje
      WHERE v.id = ?
    `, [id]);

    if (venta.length === 0) return null;

    // Obtener detalles
    const [detalles] = await pool.query(`
      SELECT
        dv.*,
        p.nombre AS producto_nombre,
        p.categoria AS producto_categoria
      FROM venta_detalles dv
      INNER JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
      ORDER BY dv.id
    `, [id]);

    return {
      ...venta[0],
      productos: detalles
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

    // Obtener detalles antes de eliminar para restaurar stock
    const [detalles] = await connection.query(`
      SELECT producto_id, cantidad
      FROM venta_detalles
      WHERE venta_id = ?
    `, [id]);

    // Restaurar stock
    for (const item of detalles) {
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
        v.created_at as fecha_venta,
        v.tipo_pago,
        v.total,
        u.username AS usuario,
        COUNT(dv.id) AS total_productos
      FROM ventas v
      LEFT JOIN users_hotel u ON v.usuario_id = u.id
      LEFT JOIN venta_detalles dv ON v.id = dv.venta_id
      WHERE DATE(v.created_at) BETWEEN ? AND ?
      GROUP BY v.id
      ORDER BY v.created_at DESC
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
        p.nombre,
        SUM(dv.cantidad) AS cantidad_vendida,
        SUM(dv.subtotal) AS ingresos_producto
      FROM venta_detalles dv
      INNER JOIN productos p ON dv.producto_id = p.id
      INNER JOIN ventas v ON dv.venta_id = v.id
      WHERE DATE(v.created_at) BETWEEN ? AND ?
      GROUP BY dv.producto_id, p.nombre
      ORDER BY cantidad_vendida DESC
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

// =====================================================
//         FUNCIONES DE CONFIGURACIÓN DE TABLAS
// =====================================================

// Configurar tablas del store
export const setupStoreTables = async () => {
  try {
    console.log('🔧️ Configurando tablas del módulo Store...');

    // Tabla de productos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria ENUM('bebidas', 'snacks', 'comida', 'otros') NOT NULL DEFAULT 'otros',
        precio DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        imagen VARCHAR(500),
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // GESTIÓN DE MIGRACIÓN: Asegurar que la columna 'activo' existe si la tabla ya existía
    try {
      await pool.query('SELECT activo FROM productos LIMIT 1');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('🔧 Agregando columna "activo" a la tabla productos...');
        await pool.query('ALTER TABLE productos ADD COLUMN activo TINYINT(1) DEFAULT 1 AFTER imagen');
        console.log('✅ Columna "activo" agregada correctamente');
      }
    }

    // Tabla de ventas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        id_medio_mensaje INT,
        nombre_cliente VARCHAR(255) NOT NULL,
        tipo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        total_letras VARCHAR(500),
        pdf_path VARCHAR(500),
        qr_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES users_hotel(id) ON DELETE SET NULL,
        FOREIGN KEY (id_medio_mensaje) REFERENCES medios_mensajes(id) ON DELETE SET NULL
      )
    `);

    // Tabla de detalles de venta
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venta_detalles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
      )
    `);

    console.log('✅ Tablas del módulo Store configuradas correctamente');

    // Insertar algunos productos de ejemplo si no existen
    const [existingProducts] = await pool.query('SELECT COUNT(*) as count FROM productos');

    if (existingProducts[0].count === 0) {
      console.log('📦 Insertando productos de ejemplo...');

      const sampleProducts = [
        ['Coca Cola 600ml', 'Refresco de cola 600ml', 'bebidas', 25.00, 50],
        ['Agua Natural 500ml', 'Agua purificada 500ml', 'bebidas', 15.00, 100],
        ['Papas Sabritas', 'Papas fritas sabor natural', 'snacks', 18.00, 30],
        ['Sandwich Club', 'Sandwich de pollo, jamón y queso', 'comida', 65.00, 20],
        ['Galletas Marías', 'Paquete de galletas marías', 'snacks', 12.00, 40],
        ['Jugo de Naranja', 'Jugo natural de naranja 500ml', 'bebidas', 30.00, 25],
        ['Chocolate Snickers', 'Barra de chocolate con cacahuates', 'snacks', 22.00, 35],
        ['Café Americano', 'Café americano caliente', 'bebidas', 20.00, 0], // Sin stock para probar
      ];

      for (const product of sampleProducts) {
        await pool.query(`
          INSERT INTO productos (nombre, descripcion, categoria, precio, stock)
          VALUES (?, ?, ?, ?, ?)
        `, product);
      }

      console.log('✅ Productos de ejemplo insertados');
    }

    return true;
  } catch (error) {
    console.error('❌ Error configurando tablas del Store:', error);
    throw error;
  }
};

// =====================================================
//         FUNCIONES DE GESTIÓN DE INVENTARIO
// =====================================================

// Obtener productos con stock bajo
export const getProductsWithLowStock = async (minStock = 5) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, categoria, stock, precio
      FROM productos
      WHERE stock <= ? AND activo = 1
      ORDER BY stock ASC, categoria
    `, [minStock]);
    return rows;
  } catch (error) {
    console.error("Error obteniendo productos con stock bajo:", error);
    throw error;
  }
};

// Obtener productos más vendidos
export const getBestSellingProducts = async (days = 30) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.nombre,
        p.categoria,
        p.precio,
        p.stock,
        SUM(dv.cantidad) as total_vendido,
        COUNT(DISTINCT v.id) as numero_ventas
      FROM productos p
      INNER JOIN venta_detalles dv ON p.id = dv.producto_id
      INNER JOIN ventas v ON dv.venta_id = v.id
      WHERE v.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND p.activo = 1
      GROUP BY p.id, p.nombre, p.categoria, p.precio, p.stock
      ORDER BY total_vendido DESC
      LIMIT 10
    `, [days]);
    return rows;
  } catch (error) {
    console.error("Error obteniendo productos más vendidos:", error);
    throw error;
  }
};

// Obtener estadísticas de ventas por categoría
export const getSalesByCategory = async (days = 30) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.categoria,
        COUNT(DISTINCT v.id) as numero_ventas,
        SUM(dv.cantidad) as productos_vendidos,
        SUM(dv.subtotal) as ingresos_totales,
        AVG(dv.precio_unitario) as precio_promedio
      FROM productos p
      INNER JOIN venta_detalles dv ON p.id = dv.producto_id
      INNER JOIN ventas v ON dv.venta_id = v.id
      WHERE v.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND p.activo = 1
      GROUP BY p.categoria
      ORDER BY ingresos_totales DESC
    `, [days]);
    return rows;
  } catch (error) {
    console.error("Error obteniendo estadísticas por categoría:", error);
    throw error;
  }
};

// Actualizar stock masivo
export const updateBulkStock = async (updates) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const update of updates) {
      const { productId, newStock, reason } = update;

      // Actualizar stock
      await connection.query(`
        UPDATE productos
        SET stock = ?, updated_at = NOW()
        WHERE id = ?
      `, [newStock, productId]);

      console.log(`Stock actualizado - Producto ${productId}: ${newStock} (${reason})`);
    }

    await connection.commit();
    return { success: true, updated: updates.length };
  } catch (error) {
    await connection.rollback();
    console.error("Error en actualización masiva de stock:", error);
    throw error;
  } finally {
    connection.release();
  }
};

// Generar reporte de inventario
export const generateInventoryReport = async () => {
  try {
    const [inventory] = await pool.query(`
      SELECT
        categoria,
        COUNT(*) as total_productos,
        SUM(stock) as stock_total,
        SUM(stock * precio) as valor_inventario,
        AVG(precio) as precio_promedio,
        MIN(stock) as stock_minimo,
        MAX(stock) as stock_maximo
      FROM productos
      WHERE activo = 1
      GROUP BY categoria
      ORDER BY valor_inventario DESC
    `);

    const [totals] = await pool.query(`
      SELECT
        COUNT(*) as productos_totales,
        SUM(stock) as stock_total,
        SUM(stock * precio) as valor_total_inventario,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as productos_agotados,
        COUNT(CASE WHEN stock <= 5 THEN 1 END) as productos_stock_bajo
      FROM productos
      WHERE activo = 1
    `);

    return {
      por_categoria: inventory,
      resumen_general: totals[0]
    };
  } catch (error) {
    console.error("Error generando reporte de inventario:", error);
    throw error;
  }
};

// Verificar disponibilidad de productos para una venta
export const checkProductAvailability = async (products) => {
  try {
    const results = [];

    for (const item of products) {
      const [product] = await pool.query(`
        SELECT id, nombre, stock, precio
        FROM productos
        WHERE id = ? AND activo = 1
      `, [item.id]);

      if (product.length === 0) {
        results.push({
          id: item.id,
          available: false,
          reason: 'Producto no encontrado'
        });
      } else if (product[0].stock < item.cantidad) {
        results.push({
          id: item.id,
          nombre: product[0].nombre,
          available: false,
          reason: `Stock insuficiente. Disponible: ${product[0].stock}, Solicitado: ${item.cantidad}`
        });
      } else {
        results.push({
          id: item.id,
          nombre: product[0].nombre,
          available: true,
          stock_disponible: product[0].stock,
          precio: product[0].precio
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    throw error;
  }
};
