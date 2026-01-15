import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addStockToProduct, // Importar nueva función
  createSale,
  updateSalePaths,
  getAllSales,
  getSaleById,
  deleteSale,
  getSalesReport
} from "../models/ModelStore.js";
import { pool } from "../../../dataBase/connectionDataBase.js";

// =====================================================
//         CONTROLADORES DE PRODUCTOS
// =====================================================

// Mostrar tienda (lista de productos)
export const showStore = async (req, res) => {
  try {
    const products = await getAllProducts();
    const user = req.session.user || {};

    console.log("📦 Productos obtenidos:", products.length);
    console.log("👤 Usuario:", user);

    res.render("showStore", {
      title: "Tienda del Hotel",
      showFooter: true,
      products,
      showNavbar: true,
      user
    });
  } catch (error) {
    console.error("❌ Error completo en showStore:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).send("Error al cargar la tienda: " + error.message);
  }
};

// Renderizar formulario de crear producto
export const renderCreateProduct = (req, res) => {
  const user = req.session.user || {};

  if (user.role !== "Administrador") {
    return res.status(403).send("Acceso denegado");
  }

  res.render("createProduct", {
    title: "Agregar Producto",
    showFooter: true,
    user
  });
};

// Crear producto
export const handleCreateProduct = async (req, res) => {
  try {
    const user = req.session.user || {};

    if (user.role !== "Administrador") {
      return res.status(403).send("Acceso denegado");
    }

    const { nombre, descripcion, categoria, precio, stock, imagen } = req.body;

    const productId = await createProduct({
      nombre,
      descripcion,
      categoria,
      precio: parseFloat(precio),
      stock: parseInt(stock),
      imagen
    });

    console.log(`✅ Producto creado con ID: ${productId}`);
    res.redirect("/store/inventory");
  } catch (error) {
    console.error("Error en handleCreateProduct:", error);
    res.status(500).send("Error al crear el producto");
  }
};

// Renderizar formulario de editar producto
export const renderEditProduct = async (req, res) => {
  try {
    const user = req.session.user || {};

    if (user.role !== "Administrador") {
      return res.status(403).send("Acceso denegado");
    }

    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).send("Producto no encontrado");
    }

    res.render("editProduct", {
      title: `Editar Producto: ${product.nombre}`,
      showFooter: true,
      product,
      user
    });
  } catch (error) {
    console.error("Error en renderEditProduct:", error);
    res.status(500).send("Error al cargar el formulario");
  }
};

// Actualizar producto
export const handleUpdateProduct = async (req, res) => {
  try {
    const user = req.session.user || {};

    if (user.role !== "Administrador") {
      return res.status(403).send("Acceso denegado");
    }

    const { id } = req.params;
    const { nombre, descripcion, categoria, precio, stock, imagen } = req.body;

    const success = await updateProduct(id, {
      nombre,
      descripcion,
      categoria,
      precio: parseFloat(precio),
      stock: parseInt(stock),
      imagen
    });

    if (success) {
      console.log(`✅ Producto ${id} actualizado`);
      res.redirect("/store/inventory");
    } else {
      res.status(404).send("Producto no encontrado");
    }
  } catch (error) {
    console.error("Error en handleUpdateProduct:", error);
    res.status(500).send("Error al actualizar el producto");
  }
};

// Eliminar producto
export const handleDeleteProduct = async (req, res) => {
  try {
    const user = req.session.user || {};

    if (user.role !== "Administrador") {
      return res.status(403).send("Acceso denegado");
    }

    const { id } = req.params;

    // VALIDACIÓN: Obtener el producto
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).send("Producto no encontrado");
    }

    // ⛔ VALIDACIÓN 1: El stock debe ser 0
    if (product.stock > 0) {
      return res.status(400).send(`No se puede eliminar el producto "${product.nombre}" porque aún tiene ${product.stock} unidades en stock. El stock debe estar en 0 para proceder.`);
    }

    // Ahora deleteProduct realiza un "Borrado Lógico" (activo = 0)
    // Esto permite mantener la integridad de las ventas históricas.
    const success = await deleteProduct(id);

    if (success) {
      console.log(`✅ Producto ${id} marcado como inactivo (soft delete)`);
      res.redirect("/store/inventory?success=delete");
    } else {
      res.status(404).send("Producto no encontrado");
    }
  } catch (error) {
    console.error("Error en handleDeleteProduct:", error);
    // Si llegara a fallar por la base de datos (por si acaso falla la validación previa)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).send("No se puede eliminar este producto porque está referenciado en ventas o reportes existentes.");
    }
    res.status(500).send("Error al eliminar el producto");
  }
};

// Añadir stock a un producto
export const handleAddStock = async (req, res) => {
  try {
    const user = req.session.user || {};
    if (user.role !== "Administrador") {
      return res.status(403).send("Acceso denegado");
    }

    const { id } = req.params;
    const { quantityToAdd } = req.body;

    if (!quantityToAdd || parseInt(quantityToAdd) <= 0) {
      return res.status(400).send("Cantidad a añadir debe ser un número positivo.");
    }

    const success = await addStockToProduct(id, parseInt(quantityToAdd));

    if (success) {
      console.log(`✅ Stock añadido al producto ${id}`);
      res.redirect("/store/inventory");
    } else {
      res.status(404).send("Producto no encontrado o error al actualizar.");
    }
  } catch (error) {
    console.error("Error en handleAddStock:", error);
    res.status(500).send("Error al añadir stock");
  }
};

// =====================================================
//         CONTROLADORES DE VENTAS
// =====================================================

// Renderizar checkout (carrito de compras)
export const renderCheckout = (req, res) => {
  const user = req.session.user || {};

  res.render("checkout", {
    title: "Finalizar Compra",
    showFooter: true,
    user
  });
};

// Procesar venta
export const handleCheckout = async (req, res) => {
  try {
    const user = req.session.user || {};
    // Simplificado para venta rápida
    const { productos, total, tipo_pago, nombre_cliente, total_letras } = req.body;

    const isQuickSale = nombre_cliente === 'Cliente de Mostrador';
    console.log(`🛒 Procesando venta rápida...`);
    console.log("Productos:", productos);
    console.log("Total:", total);

    // Parsear productos si viene como string
    const productosArray = typeof productos === 'string' ? JSON.parse(productos) : productos;

    // Crear venta
    const ventaId = await createSale({
      usuario_id: user.id,
      id_medio_mensaje: null, // No aplica para ventas rápidas
      nombre_cliente,
      tipo_pago,
      total: parseFloat(total),
      total_letras,
      productos: productosArray
    });

    console.log("✅ Venta creada con ID:", ventaId);

    // Para ventas rápidas, solo responder con éxito
    if (isQuickSale) {
      return res.json({
        success: true,
        message: "Venta registrada exitosamente",
        ventaId
      });
    }

    // Generar PDF y QR
    try {
      const { generateSalePDF } = await import("../utils/storePdfGenerator.js");
      const { generarQR } = await import("../../rooms/utils/qrGenerator.js");

      // Obtener venta completa
      const venta = await getSaleById(ventaId);

      // Generar QR
      const qrData = {
        id_venta: ventaId,
        cliente: nombre_cliente || "Cliente",
        total: total,
        fecha: new Date().toLocaleDateString('es-MX')
      };
      const qrPath = await generarQR(qrData, "venta");
      console.log("✅ QR generado:", qrPath);

      // Generar PDF
      const pdfPath = await generateSalePDF(venta, qrPath);
      console.log("✅ PDF generado:", pdfPath);

      // Actualizar rutas en BD
      await updateSalePaths(ventaId, pdfPath, qrPath);

      // Enviar comprobante si se solicitó
      if (send_email === "on" || send_whatsapp === "on") {
        const { enviarComprobante } = await import("../utils/storeEmailService.js");
        await enviarComprobante(venta, pdfPath, {
          sendEmail: send_email === "on",
          sendWhatsApp: send_whatsapp === "on"
        });
      }
    } catch (pdfError) {
      console.error("❌ Error al generar comprobante:", pdfError);
    }

    res.json({
      success: true,
      message: "Venta registrada exitosamente",
      ventaId
    });
  } catch (error) {
    console.error("Error en handleCheckout:", error);
    res.status(500).json({
      success: false,
      error: "Error al procesar la venta",
      details: error.message
    });
  }
};

// Mostrar lista de ventas
export const showSales = async (req, res) => {
  try {
    const user = req.session.user || {};
    const sales = await getAllSales();

    res.render("salesList", {
      title: "Ventas Realizadas",
      showNavbar: true,
      showFooter: true,
      sales,
      user
    });
  } catch (error) {
    console.error("Error en showSales:", error);
    res.status(500).send("Error al cargar las ventas");
  }
};

// Ver detalle de venta
export const showSaleDetail = async (req, res) => {
  try {
    const user = req.session.user || {};
    const { id } = req.params;
    const sale = await getSaleById(id);

    if (!sale) {
      return res.status(404).send("Venta no encontrada");
    }

    res.render("saleDetail", {
      title: `Venta #${id}`,
      showFooter: true,
      showNavbar: true,
      sale,
      user
    });
  } catch (error) {
    console.error("Error en showSaleDetail:", error);
    res.status(500).send("Error al cargar el detalle de la venta");
  }
};

// Eliminar venta
export const handleDeleteSale = async (req, res) => {
  try {
    const user = req.session.user || {};

    if (user.role !== "Administrador") {
      return res.status(403).send("Acceso denegado");
    }

    const { id } = req.params;

    // Obtener venta antes de eliminar para borrar archivos
    const venta = await getSaleById(id);

    if (venta) {
      const fs = await import("fs");
      const fsPromises = fs.promises;

      // Eliminar PDF
      if (venta.pdf_path) {
        try {
          if (fs.default.existsSync(venta.pdf_path)) {
            await fsPromises.unlink(venta.pdf_path);
            console.log(`🗑️ PDF eliminado: ${venta.pdf_path}`);
          }
        } catch (error) {
          console.error("⚠️ Error al eliminar PDF:", error.message);
        }
      }

      // Eliminar QR
      if (venta.qr_path) {
        try {
          if (fs.default.existsSync(venta.qr_path)) {
            await fsPromises.unlink(venta.qr_path);
            console.log(`🗑️ QR eliminado: ${venta.qr_path}`);
          }
        } catch (error) {
          console.error("⚠️ Error al eliminar QR:", error.message);
        }
      }
    }

    const success = await deleteSale(id);

    if (success) {
      console.log(`✅ Venta ${id} eliminada y stock restaurado`);
      res.redirect("/store/sales");
    } else {
      res.status(404).send("Venta no encontrada");
    }
  } catch (error) {
    console.error("Error en handleDeleteSale:", error);
    res.status(500).send("Error al eliminar la venta");
  }
};

// =====================================================
//         CONTROLADORES DE REPORTES
// =====================================================

// Renderizar página de reportes
export const renderReports = (req, res) => {
  const user = req.session.user || {};

  res.render("salesReport", {
    title: "Reportes de Ventas",
    showFooter: true,
    showNavbar: true,
    user
  });
};

// Generar reporte de ventas
export const generateReport = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        error: "Fechas requeridas"
      });
    }

    const reporte = await getSalesReport(fechaInicio, fechaFin);

    res.json({
      success: true,
      reporte
    });
  } catch (error) {
    console.error("Error en generateReport:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar el reporte"
    });
  }
};

// Enviar reporte por email
export const sendReportByEmail = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, periodo, destinatario, asunto } = req.body;

    const reporte = await getSalesReport(fechaInicio, fechaFin);
    if (periodo) reporte.periodo = periodo;

    // Validar si hay datos antes de generar y enviar
    if (!reporte.datos || reporte.datos.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No se encontraron ventas para el periodo seleccionado. No se puede enviar un reporte vacío."
      });
    }

    // Generar PDF del reporte
    const { generateReportPDF } = await import("../utils/storeReportGenerator.js");
    const pdfPath = await generateReportPDF(reporte);

    // 4. Configurar y enviar el correo
    const emailService = (await import("../../../services/emailService.js")).default;
    const fs = await import("fs");

    await emailService.send({
      to: destinatario,
      subject: asunto || `📊 Reporte de Ventas: ${fechaInicio} - ${fechaFin}`,
      text: `Adjunto se encuentra el reporte de ventas del período ${fechaInicio} al ${fechaFin}.`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Reporte de Ventas</h2>
          <p>Se ha generado un nuevo reporte de ventas para el <b>Hotel Residency Club</b>.</p>
          <p><b>Período:</b> ${fechaInicio} al ${fechaFin}</p>
          <hr />
          <p style="font-size: 0.8em; color: #666;">Este es un correo automático, por favor no responda.</p>
        </div>
      `,
      attachments: [{
        filename: `Reporte_Ventas_${periodo || 'periodo'}_${fechaInicio}_${fechaFin}.pdf`,
        content: fs.default.readFileSync(pdfPath)
      }]
    });

    console.log(`✅ [Email] Reporte enviado correctamente a: ${destinatario}`);
    res.json({
      success: true,
      message: "Reporte enviado por correo exitosamente"
    });
  } catch (error) {
    console.error("Error en sendReportByEmail:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el reporte"
    });
  }
};

// Enviar reporte por WhatsApp
export const sendReportByWhatsApp = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, periodo, telefono } = req.body;

    const reporte = await getSalesReport(fechaInicio, fechaFin);
    if (periodo) reporte.periodo = periodo;

    // Validar si hay datos antes de generar y enviar
    if (!reporte.datos || reporte.datos.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No se encontraron ventas para el periodo seleccionado. No se puede enviar un reporte vacío."
      });
    }

    // Generar PDF del reporte
    const { generateReportPDF } = await import("../utils/storeReportGenerator.js");
    const pdfPath = await generateReportPDF(reporte);

    // 4. Enviar a través del servicio de WhatsApp
    const whatsappService = (await import("../../../services/whatsappService.js")).default;

    if (!whatsappService.isConnected) {
      throw new Error("El servicio de WhatsApp no está vinculado.");
    }

    const mensaje = `📊 *Reporte de Ventas (${periodo || 'General'})*\n📅 Periodo: ${fechaInicio} al ${fechaFin}\n🏢 *Hotel Residency Club*`;
    const nombreArchivo = `Reporte_${periodo || 'Ventas'}_${fechaInicio}_${fechaFin}.pdf`;

    const result = await whatsappService.enviarMensajeConPDF(telefono, mensaje, pdfPath, nombreArchivo);

    if (result.success) {
      console.log(`✅ [WhatsApp] Reporte enviado correctamente a: ${telefono}`);
      res.json({
        success: true,
        message: "Reporte enviado por WhatsApp exitosamente"
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Error en sendReportByWhatsApp:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el reporte",
      details: error.message
    });
  }
};
