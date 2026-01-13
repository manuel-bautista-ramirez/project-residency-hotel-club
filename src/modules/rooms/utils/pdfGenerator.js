import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "./validadorDirectorios.js";

/**
 * Genera comprobantes de Renta/Reservación con el diseño Indigo Corporativo.
 */
export const generateAndSendPDF = async (datos, tipo, qrPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      const normalizedTipo = tipo.toLowerCase();
      const tipoMap = { renta: "rentas", reservacion: "reservaciones", reservation: "reservaciones" };
      const folderTipo = tipoMap[normalizedTipo];

      const rutaBase = validadorDirectorios.obtenerRuta("pdf", folderTipo);
      const fileName = `comprobante_${folderTipo}_${Date.now()}.pdf`;
      const filePath = path.join(rutaBase, fileName);

      if (!validadorDirectorios.validarRutaEspecifica("pdf", folderTipo)) {
        throw new Error(`Error de acceso a la carpeta: ${rutaBase}`);
      }

      const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 } });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- ESTILO INDIGO CORPORATIVO ---
      const ui = {
        primary: "#4F46E5", secondary: "#1E293B", text: "#334155",
        muted: "#64748B", light: "#F8FAFC", border: "#E2E8F0",
        white: "#FFFFFF", accent: "#F59E0B", success: "#059669"
      };

      // --- ENCABEZADO ---
      doc.rect(0, 0, doc.page.width, 120).fill(ui.secondary);
      doc.rect(0, 117, doc.page.width, 3).fill(ui.accent);

      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(22).text("HOTEL RESIDENCY CLUB", 50, 40);
      doc.fontSize(10).font("Helvetica").fillColor("#94A3B8").text("Control de Estancia y Reservaciones", 50, 65);

      const labelTipo = folderTipo === "rentas" ? "COMPROBANTE DE RENTA" : "COMPROBANTE DE RESERVACIÓN";
      doc.rect(doc.page.width - 250, 40, 200, 40, 5).fill(ui.primary);
      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(10).text(labelTipo, doc.page.width - 250, 55, { width: 200, align: "center" });

      let y = 150;

      // --- CLIENTE ---
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(14).text("Detalle del Cliente", 50, y);
      y += 25;

      const clientInfo = [
        { l: "Huésped:", v: datos.nombre || datos.nombre_cliente || "General" },
        { l: "Correo:", v: datos.email || datos.correo || "N/A" },
        { l: "Teléfono:", v: datos.phone || datos.telefono || "N/A" }
      ];

      clientInfo.forEach(item => {
        doc.fillColor(ui.muted).font("Helvetica").fontSize(9).text(item.l, 50, y);
        doc.fillColor(ui.text).font("Helvetica-Bold").fontSize(10).text(item.v, 140, y);
        y += 18;
      });

      y += 20;

      // --- TRANSACCIÓN ---
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(14).text("Detalles de la Habitación", 50, y);
      y += 25;

      const monto = Number(datos.monto || datos.price || 0);
      const enganche = Number(datos.enganche || 0);
      const habitacion = datos.numero_habitacion || "N/A";

      const roomInfo = [
        { l: "Habitación:", v: habitacion },
        { l: "Tipo:", v: datos.tipo_habitacion || "Estándar" },
        { l: "Check-in:", v: datos.fecha_ingreso || "N/A" },
        { l: "Check-out:", v: datos.fecha_salida || "N/A" }
      ];

      roomInfo.forEach(item => {
        doc.fillColor(ui.muted).font("Helvetica").fontSize(9).text(item.l, 50, y);
        doc.fillColor(ui.text).font("Helvetica-Bold").fontSize(10).text(item.v, 140, y);
        y += 18;
      });

      y += 25;

      // --- PAGOS ---
      doc.roundedRect(50, y, 495, (enganche > 0 ? 95 : 60), 8).fill(ui.light);
      doc.roundedRect(50, y, 495, (enganche > 0 ? 95 : 60), 8).lineWidth(1).stroke(ui.border);

      let py = y + 15;
      doc.fillColor(ui.muted).font("Helvetica-Bold").fontSize(9).text("TOTAL A PAGAR:", 70, py);
      doc.fillColor(ui.secondary).fontSize(14).text(`$${monto.toLocaleString()}`, 350, py, { width: 170, align: "right" });

      if (enganche > 0) {
        py += 25;
        doc.fillColor(ui.muted).fontSize(9).text("ANTICIPO / ENGANCHE:", 70, py);
        doc.fillColor(ui.success).fontSize(12).text(`-$${enganche.toLocaleString()}`, 350, py, { width: 170, align: "right" });
        py += 25;
        doc.fillColor(ui.primary).fontSize(10).text("SALDO PENDIENTE:", 70, py);
        doc.fillColor(ui.primary).fontSize(14).text(`$${(monto - enganche).toLocaleString()}`, 350, py, { width: 170, align: "right" });
      }

      y += (enganche > 0 ? 120 : 80);

      // --- QR ---
      if (qrPath && fs.existsSync(qrPath)) {
        doc.image(qrPath, (doc.page.width - 80) / 2, y, { width: 80 });
      }

      const footerY = doc.page.height - 60;
      doc.fillColor(ui.muted).fontSize(8).text("Hotel Residency Club — Comprobante Oficial", 0, footerY, { align: "center", width: doc.page.width });

      doc.end();
      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};
