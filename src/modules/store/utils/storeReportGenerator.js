import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "./validadorDirectorios.js";

/**
 * Genera un reporte de ventas unificado con el diseño Indigo Corporativo.
 */
export const generateReportPDF = async (reporte) => {
  return new Promise((resolve, reject) => {
    try {
      const carpetaDestino = validadorDirectorios.obtenerRuta("pdf", "reportes");
      const periodoLabel = reporte.periodo ? reporte.periodo.toLowerCase() : "ventas";
      const nombreArchivo = `Reporte_${periodoLabel}_${reporte.fechaInicio}_${reporte.fechaFin}_${Date.now()}.pdf`;
      const rutaAbsoluta = path.join(carpetaDestino, nombreArchivo);

      if (!validadorDirectorios.validarRutaEspecifica("pdf", "reportes")) {
        throw new Error(`Error de acceso al directorio de reportes`);
      }

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 30, left: 50, right: 50 },
        bufferPages: true
      });

      const stream = fs.createWriteStream(rutaAbsoluta);
      doc.pipe(stream);

      const ui = {
        primary: "#4F46E5",
        secondary: "#1E293B",
        text: "#334155",
        muted: "#94A3B8",
        light: "#F8FAFC",
        border: "#E2E8F0",
        white: "#FFFFFF",
        accent: "#F59E0B",
        success: "#059669"
      };

      const dibujarEncabezado = () => {
        doc.rect(0, 0, doc.page.width, 100).fill(ui.secondary);
        doc.rect(0, 97, doc.page.width, 3).fill(ui.accent);
        doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(20).text("HOTEL RESIDENCY CLUB", 50, 35);
        doc.fontSize(9).font("Helvetica").fillColor("#94A3B8").text("Gestión Administrativa — Módulo de Tienda", 50, 58);
        const titulo = `REPORTE ${reporte.periodo ? reporte.periodo.toUpperCase() : "DE VENTAS"}`;
        doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(12).text(titulo, 0, 40, { align: "right", width: doc.page.width - 50 });
        doc.fontSize(8).font("Helvetica").fillColor("#CBD5E1").text(`${reporte.fechaInicio} al ${reporte.fechaFin}`, 0, 58, { align: "right", width: doc.page.width - 50 });
      };

      const dibujarPiePagina = (pageNum, total) => {
        doc.rect(50, doc.page.height - 50, 495, 0.5).fill(ui.border);
        doc.fillColor(ui.muted).fontSize(7).font("Helvetica");
        doc.text("Hotel Residency Club — Documento Administrativo Confidencial", 50, doc.page.height - 40);
        doc.text(`Página ${pageNum} de ${total}`, 0, doc.page.height - 40, { align: "right", width: doc.page.width - 50 });
      };

      // --- CONTENIDO ---
      dibujarEncabezado();
      let currentY = 130;

      // Resumen
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(15).text("Resumen de Operación", 50, currentY);
      currentY += 25;

      const items = [
        { l: "Ventas Totales", v: reporte.estadisticas.totalVentas, c: ui.primary },
        { l: "Ingresos Brutos", v: `$${Number(reporte.estadisticas.totalIngresos).toLocaleString()}`, c: ui.success },
        { l: "Ticket Promedio", v: `$${Number(reporte.estadisticas.promedioVenta).toLocaleString()}`, c: ui.accent }
      ];

      let cardX = 50;
      items.forEach(card => {
        doc.roundedRect(cardX, currentY, 158, 65, 8).fillAndStroke(ui.light, ui.border);
        doc.fillColor(ui.muted).font("Helvetica").fontSize(8).text(card.l.toUpperCase(), cardX, currentY + 15, { width: 158, align: "center" });
        doc.fillColor(card.c).font("Helvetica-Bold").fontSize(15).text(card.v, cardX, currentY + 32, { width: 158, align: "center" });
        cardX += 168;
      });

      currentY += 95;

      // 1. Ranking de Productos (Si hay datos)
      if (reporte.productosMasVendidos && reporte.productosMasVendidos.length > 0) {
        doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(13).text("Top Productos Vendidos", 50, currentY);
        currentY += 20;

        doc.rect(50, currentY, 495, 22).fill(ui.secondary);
        doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(8);
        doc.text("PRODUCTO", 65, currentY + 7);
        doc.text("CANT.", 400, currentY + 7, { width: 40, align: "center" });
        doc.text("TOTAL", 460, currentY + 7, { width: 75, align: "right" });
        currentY += 22;

        reporte.productosMasVendidos.slice(0, 5).forEach((item, idx) => {
          if (idx % 2 !== 0) doc.rect(50, currentY, 495, 22).fill(ui.light);
          doc.fillColor(ui.text).font("Helvetica").fontSize(8);
          doc.text(item.nombre, 65, currentY + 7, { width: 300, ellipsis: true });
          doc.text(item.cantidad_vendida.toString(), 400, currentY + 7, { width: 40, align: "center" });
          doc.fillColor(ui.secondary).font("Helvetica-Bold").text(`$${Number(item.ingresos_producto).toLocaleString()}`, 460, currentY + 7, { width: 75, align: "right" });
          currentY += 22;
        });
        currentY += 30;
      }

      // 2. Listado Detallado de Transacciones
      if (reporte.datos && reporte.datos.length > 0) {
        if (currentY > doc.page.height - 100) { doc.addPage(); dibujarEncabezado(); currentY = 120; }

        doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(13).text("Detalle de Transacciones", 50, currentY);
        currentY += 20;

        const dibujarCabecera = (y) => {
          doc.rect(50, y, 495, 22).fill(ui.secondary);
          doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(8);
          doc.text("FOLIO", 65, y + 7);
          doc.text("CLIENTE", 110, y + 7);
          doc.text("PAGO", 380, y + 7);
          doc.text("TOTAL", 460, y + 7, { width: 75, align: "right" });
        };

        dibujarCabecera(currentY);
        currentY += 22;

        reporte.datos.forEach((venta, idx) => {
          if (currentY > doc.page.height - 80) {
            doc.addPage(); dibujarEncabezado(); currentY = 120; dibujarCabecera(currentY); currentY += 22;
          }
          if (idx % 2 !== 0) doc.rect(50, currentY, 495, 22).fill(ui.light);
          doc.fillColor(ui.text).font("Helvetica").fontSize(8);
          doc.text(`#${venta.id}`, 65, currentY + 7);
          doc.text(venta.nombre_cliente || "Público General", 110, currentY + 7, { width: 260, ellipsis: true });
          doc.text(venta.tipo_pago, 380, currentY + 7);
          doc.fillColor(ui.secondary).font("Helvetica-Bold").text(`$${Number(venta.total).toLocaleString()}`, 460, currentY + 7, { width: 75, align: "right" });
          currentY += 22;
        });
      }

      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        dibujarPiePagina(i + 1, range.count);
      }

      doc.end();
      stream.on("finish", () => resolve(rutaAbsoluta));
    } catch (error) {
      reject(error);
    }
  });
};
