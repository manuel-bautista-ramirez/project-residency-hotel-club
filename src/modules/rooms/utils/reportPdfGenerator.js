import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "./validadorDirectorios.js";

/**
 * Genera reportes administrativos de habitaciones (Rentas/Reservaciones) con el diseño Indigo Corporativo.
 */
export const generateReportPDF = async (reporte) => {
  return new Promise((resolve, reject) => {
    try {
      const rutaBase = validadorDirectorios.obtenerRuta("pdf", "reportes");
      const fileName = `reporte_habitaciones_${reporte.tipo}_${Date.now()}.pdf`;
      const filePath = path.join(rutaBase, fileName);

      if (!validadorDirectorios.validarRutaEspecifica("pdf", "reportes")) {
        throw new Error(`Error de acceso al directorio de reportes`);
      }

      const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 }, bufferPages: true });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- ESTILO INDIGO CORPORATIVO ---
      const ui = {
        primary: "#4F46E5", secondary: "#1E293B", text: "#334155",
        muted: "#64748B", light: "#F8FAFC", border: "#E2E8F0",
        white: "#FFFFFF", accent: "#F59E0B", success: "#059669"
      };

      // --- ENCABEZADO ---
      doc.rect(0, 0, doc.page.width, 130).fill(ui.secondary);
      doc.rect(0, 127, doc.page.width, 3).fill(ui.accent);

      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(22).text("HOTEL RESIDENCY CLUB", 50, 40);
      doc.fontSize(10).font("Helvetica").fillColor("#94A3B8").text("Panel de Administración — Reporte Operativo", 50, 65);

      const titulo = `REPORTE DE ${reporte.tipo.toUpperCase()}`;
      doc.rect(doc.page.width - 250, 40, 200, 40, 5).fill(ui.primary);
      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(11).text(titulo, doc.page.width - 250, 55, { width: 200, align: "center" });

      doc.fillColor("#CBD5E1").fontSize(9).text(`Período: ${reporte.fechaInicio} al ${reporte.fechaFin}`, doc.page.width - 250, 90, { width: 200, align: "center" });

      let currentY = 160;

      // --- RESUMEN ---
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(16).text("Resumen Operativo", 50, currentY);
      currentY += 30;

      const statCards = [];
      if (reporte.tipo === "rentas") {
        statCards.push({ l: "Total Rentas", v: reporte.estadisticas.totalRentas, c: ui.primary });
        statCards.push({ l: "Ingreso Total", v: `$${reporte.estadisticas.totalIngresos.toLocaleString()}`, c: ui.success });
      } else {
        statCards.push({ l: "Reservaciones", v: reporte.estadisticas.totalReservaciones, c: ui.primary });
        statCards.push({ l: "Monto Esperado", v: `$${reporte.estadisticas.totalMontoEsperado.toLocaleString()}`, c: ui.accent });
        statCards.push({ l: "Enganches recibido", v: `$${reporte.estadisticas.totalEnganche.toLocaleString()}`, c: ui.success });
      }

      const cardW = 158;
      let cardX = 50;
      statCards.forEach(card => {
        doc.roundedRect(cardX, currentY, cardW, 70, 8).fill(ui.light);
        doc.roundedRect(cardX, currentY, cardW, 70, 8).lineWidth(1).stroke(ui.border);
        doc.fillColor(ui.muted).font("Helvetica").fontSize(8).text(card.l.toUpperCase(), cardX, currentY + 18, { width: cardW, align: "center" });
        doc.fillColor(card.c).font("Helvetica-Bold").fontSize(15).text(card.v, cardX, currentY + 38, { width: cardW, align: "center" });
        cardX += cardW + 10;
      });

      currentY += 100;

      // --- TABLA DETALLADA ---
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(14).text("Detalle de Registros", 50, currentY);
      currentY += 25;

      doc.rect(50, currentY, 495, 30).fill(ui.secondary);
      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(9);
      doc.text("CLIENTE", 65, currentY + 10);
      doc.text("HAB.", 250, currentY + 10);
      doc.text("ESTADO", 300, currentY + 10);
      doc.text("MONTO", 450, currentY + 10, { width: 85, align: "right" });

      currentY += 30;

      reporte.datos.forEach((item, i) => {
        if (currentY > doc.page.height - 80) {
          doc.addPage();
          currentY = 50;
        }
        if (i % 2 !== 0) doc.rect(50, currentY, 495, 25).fill(ui.light);

        doc.fillColor(ui.text).font("Helvetica").fontSize(8);
        doc.text(item.nombre_cliente, 65, currentY + 8, { width: 180, ellipsis: true });
        doc.text(item.numero_habitacion, 250, currentY + 8);
        doc.text(item.tipo_pago || "Reservado", 300, currentY + 8);
        doc.fillColor(ui.secondary).font("Helvetica-Bold").text(`$${Number(item.monto).toLocaleString()}`, 450, currentY + 8, { width: 85, align: "right" });

        currentY += 25;
      });

      // Numeración de páginas
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fillColor(ui.muted).fontSize(8).text(`Página ${i + 1} de ${pages.count}`, 0, doc.page.height - 40, { align: "center", width: doc.page.width });
      }

      doc.end();
      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};
