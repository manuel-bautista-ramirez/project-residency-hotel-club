import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "./validadorDirectorios.js";

/**
 * Genera un reporte de ventas en formato PDF con un diseño profesional y limpio.
 * @param {Object} reporte - Datos del reporte obtenidos de la base de datos.
 * @returns {Promise<string>} - Ruta absoluta del archivo generado.
 */
export const generateReportPDF = async (reporte) => {
  return new Promise((resolve, reject) => {
    try {
      // 1. Preparación de rutas y validación de carpetas
      const carpetaDestino = validadorDirectorios.obtenerRuta("pdf", "reportes");
      const nombreArchivo = `reporte_ventas_${reporte.fechaInicio}_${reporte.fechaFin}_${Date.now()}.pdf`;
      const rutaAbsoluta = path.join(carpetaDestino, nombreArchivo);

      if (!validadorDirectorios.validarRutaEspecifica("pdf", "reportes")) {
        throw new Error(`No se pudo acceder o crear la carpeta: ${carpetaDestino}`);
      }

      // 2. Configuración del documento PDF (A4 con márgenes amplios)
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        bufferPages: true // Habilitado para añadir numeración al final
      });

      // 3. Configuración del stream de escritura (más confiable que doc.on('end'))
      const stream = fs.createWriteStream(rutaAbsoluta);
      doc.pipe(stream);

      // 4. Definición de Estilos y Colores Corporativos
      const ui = {
        primary: "#4F46E5",    // Indigo (Acento principal)
        secondary: "#1E293B",  // Slate 800 (Encabezados)
        text: "#334155",       // Slate 700 (Cuerpo)
        muted: "#94A3B8",      // Slate 400 (Secundarios)
        light: "#F8FAFC",      // Slate 50 (Fondos de filas)
        border: "#E2E8F0",      // Slate 200 (Divisores)
        white: "#FFFFFF",
        accent: "#F59E0B"      // Amber (Toques visuales)
      };

      // --- DISEÑO: ENCABEZADO ---
      // Fondo superior oscuro
      doc.rect(0, 0, doc.page.width, 140).fill(ui.secondary);
      doc.rect(0, 137, doc.page.width, 3).fill(ui.accent);

      // Identidad del Hotel
      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(22).text("HOTEL RESIDENCY CLUB", 50, 40);
      doc.fontSize(10).font("Helvetica").fillColor("#94A3B8").text("Gestión Administrativa - Módulo de Tienda", 50, 65);

      // Titular del Documento (Lado derecho)
      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(14).text("REPORTE DE VENTAS", 0, 45, { align: "right", width: doc.page.width - 50 });
      doc.fontSize(9).font("Helvetica").fillColor("#CBD5E1").text(`Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, 0, 65, { align: "right", width: doc.page.width - 50 });
      doc.text(`Período: ${reporte.fechaInicio} al ${reporte.fechaFin}`, 0, 80, { align: "right", width: doc.page.width - 50 });

      let currentY = 170;

      // --- SECCIÓN: RESUMEN GENERAL (TARJETAS) ---
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(16).text("Resumen de Operación", 50, currentY);
      currentY += 30;

      const cards = [
        { label: "Ventas Totales", value: reporte.estadisticas.totalVentas, color: ui.primary },
        { label: "Ingreso Bruto", value: `$${reporte.estadisticas.totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, color: "#059669" }, // Emerald 600
        { label: "Promedio/Venta", value: `$${reporte.estadisticas.promedioVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, color: ui.accent }
      ];

      const cardW = 158;
      const cardH = 75;
      let cardX = 50;

      cards.forEach(card => {
        // Marco de la tarjeta
        doc.roundedRect(cardX, currentY, cardW, cardH, 8).fill(ui.light);
        doc.roundedRect(cardX, currentY, cardW, cardH, 8).lineWidth(1).stroke(ui.border);

        // Contenido
        doc.fillColor(ui.muted).font("Helvetica").fontSize(8).text(card.label.toUpperCase(), cardX, currentY + 18, { width: cardW, align: "center" });
        doc.fillColor(card.color).font("Helvetica-Bold").fontSize(16).text(card.value, cardX, currentY + 38, { width: cardW, align: "center" });

        cardX += cardW + 10;
      });

      currentY += cardH + 40;

      // --- SECCIÓN: MÉTODOS DE PAGO ---
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(14).text("Desglose por Método de Pago", 50, currentY);
      currentY += 25;

      const pagos = [
        { label: "Efectivo", monto: reporte.estadisticas.ventasPorTipoPago.efectivo },
        { label: "Transferencia", monto: reporte.estadisticas.ventasPorTipoPago.transferencia },
        { label: "Tarjeta de Crédito/Débito", monto: reporte.estadisticas.ventasPorTipoPago.tarjeta }
      ];

      pagos.forEach((p, i) => {
        if (i % 2 === 0) doc.rect(50, currentY, 495, 25).fill(ui.light);
        doc.fillColor(ui.text).font("Helvetica").fontSize(10).text(p.label, 60, currentY + 8);
        doc.fillColor(ui.secondary).font("Helvetica-Bold").text(`$${p.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 350, currentY + 8, { width: 185, align: "right" });
        currentY += 25;
      });

      currentY += 40;

      // --- SECCIÓN: TABLA DE PRODUCTOS ---
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(14).text("Ranking: Productos Más Vendidos", 50, currentY);
      currentY += 25;

      // Cabecera de Tabla
      doc.rect(50, currentY, 495, 30).fill(ui.secondary);
      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(9);
      doc.text("PRODUCTO", 65, currentY + 10);
      doc.text("CATEGORÍA", 280, currentY + 10);
      doc.text("UNIDADES", 400, currentY + 10, { width: 60, align: "center" });
      doc.text("TOTAL", 460, currentY + 10, { width: 75, align: "right" });

      currentY += 30;

      // Filas de Productos
      reporte.productosMasVendidos.slice(0, 10).forEach((item, idx) => {
        // Gestión de salto de página
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 60;
        }

        if (idx % 2 !== 0) doc.rect(50, currentY, 495, 30).fill(ui.light);

        doc.fillColor(ui.text).font("Helvetica").fontSize(9);
        doc.text(item.nombre, 65, currentY + 10, { width: 210, ellipsis: true });
        doc.text(item.categoria, 280, currentY + 10);
        doc.text(item.cantidad_vendida.toString(), 400, currentY + 10, { width: 60, align: "center" });
        doc.fillColor(ui.secondary).font("Helvetica-Bold").text(`$${Number(item.ingresos_producto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 460, currentY + 10, { width: 75, align: "right" });

        currentY += 30;
      });

      // --- DISEÑO: PIE DE PÁGINA (Paginación) ---
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.rect(50, doc.page.height - 60, 495, 0.5).fill(ui.border);
        doc.fillColor(ui.muted).fontSize(8).font("Helvetica");
        doc.text("Este reporte es un documento interno del Hotel Residency Club.", 50, doc.page.height - 45);
        doc.text(`Página ${i + 1} de ${totalPages}`, 0, doc.page.height - 45, { align: "right", width: doc.page.width - 50 });
      }

      // --- FINALIZACIÓN ---
      doc.end();

      stream.on("finish", () => {
        console.log(`✅ [PDF] Generado: ${nombreArchivo}`);
        resolve(rutaAbsoluta);
      });

      stream.on("error", (err) => {
        console.error("❌ [PDF] Error en Stream:", err);
        reject(err);
      });

    } catch (error) {
      console.error("❌ [PDF] Error Crítico:", error.message);
      reject(error);
    }
  });
};
