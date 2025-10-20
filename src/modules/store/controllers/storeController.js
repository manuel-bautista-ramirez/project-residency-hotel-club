import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createSale,
  updateSalePaths,
  getAllSales,
  getSaleById,
  deleteSale,
  getSalesReport
} from "../models/ModelStore.js";
import { createMessageMethod } from "../../rooms/models/ModelRoom.js";

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
    res.redirect("/store");
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
      res.redirect("/store");
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
    const success = await deleteProduct(id);

    if (success) {
      console.log(`✅ Producto ${id} eliminado`);
      res.redirect("/store");
    } else {
      res.status(404).send("Producto no encontrado");
    }
  } catch (error) {
    console.error("Error en handleDeleteProduct:", error);
    res.status(500).send("Error al eliminar el producto");
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
    const { nombre_cliente, email, telefono, tipo_pago, productos, total, total_letras, send_email, send_whatsapp } = req.body;

    // Para ventas rápidas, no necesitamos email, teléfono, etc.
    const isQuickSale = nombre_cliente === 'Cliente de Mostrador';

    console.log(`🛒 Procesando ${isQuickSale ? 'venta rápida' : 'venta'}...`);
    console.log("Productos:", productos);
    console.log("Total:", total);

    // Crear medio de mensaje solo si NO es venta rápida y hay email o teléfono
    let messageMethodId = null;
    if (!isQuickSale && (email || telefono)) {
      messageMethodId = await createMessageMethod(email, telefono);
      console.log("✅ Medio de mensaje creado:", messageMethodId);
    }

    // Parsear productos si viene como string
    const productosArray = typeof productos === 'string' ? JSON.parse(productos) : productos;

    // Crear venta
    const ventaId = await createSale({
      usuario_id: user.id,
      id_medio_mensaje: messageMethodId,
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
    const { fechaInicio, fechaFin, destinatario, asunto } = req.body;

    const reporte = await getSalesReport(fechaInicio, fechaFin);

    // Generar PDF del reporte
    const { generateReportPDF } = await import("../utils/storeReportGenerator.js");
    const pdfPath = await generateReportPDF(reporte);

    // Enviar por email
    const emailService = (await import("../../../services/emailService.js")).default;
    const fs = await import("fs");

    await emailService.send({
      to: destinatario,
      subject: asunto || `Reporte de Ventas - ${fechaInicio} a ${fechaFin}`,
      text: `Reporte de ventas del ${fechaInicio} al ${fechaFin}`,
      html: `<p>Adjunto encontrará el reporte de ventas del período solicitado.</p>`,
      attachments: [{
        filename: `reporte_ventas_${fechaInicio}_${fechaFin}.pdf`,
        content: fs.default.readFileSync(pdfPath)
      }]
    });

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
    const { fechaInicio, fechaFin, telefono } = req.body;

    const reporte = await getSalesReport(fechaInicio, fechaFin);

    // Generar PDF del reporte
    const { generateReportPDF } = await import("../utils/storeReportGenerator.js");
    const pdfPath = await generateReportPDF(reporte);

    // Enviar por WhatsApp
    const whatsappService = (await import("../../../services/whatsappService.js")).default;
    const fs = await import("fs");

    const jid = whatsappService.formatPhoneNumber(telefono);

    if (whatsappService.isConnected && whatsappService.socket) {
      await whatsappService.socket.sendMessage(jid, {
        document: fs.default.readFileSync(pdfPath),
        mimetype: 'application/pdf',
        fileName: `reporte_ventas_${fechaInicio}_${fechaFin}.pdf`,
        caption: `📊 Reporte de Ventas\n${fechaInicio} - ${fechaFin}`
      });
      console.log(`✅ Reporte enviado por WhatsApp a ${telefono}`);
    }

    res.json({
      success: true,
      message: "Reporte enviado por WhatsApp exitosamente"
    });
  } catch (error) {
    console.error("Error en sendReportByWhatsApp:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el reporte"
    });
  }
};
