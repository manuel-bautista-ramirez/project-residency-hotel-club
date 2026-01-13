import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "./validadorDirectorios.js";

/**
 * Genera un comprobante de venta de tienda con el diseño Indigo Corporativo.
 */
export const generateSalePDF = async (venta, qrPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      const carpetaDestino = validadorDirectorios.obtenerRuta("pdf", "ventas");
      const nombreArchivo = `ticket_venta_${venta.id}_${Date.now()}.pdf`;
      const rutaAbsoluta = path.join(carpetaDestino, nombreArchivo);

      if (!validadorDirectorios.validarRutaEspecifica("pdf", "ventas")) {
        throw new Error(`Error de acceso a la carpeta de ventas: ${carpetaDestino}`);
      }

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 60, right: 60 }
      });

      const stream = fs.createWriteStream(rutaAbsoluta);
      doc.pipe(stream);

      // --- ESTILO INDIGO CORPORATIVO ---
      const ui = {
        primary: "#4F46E5",    // Indigo
        secondary: "#1E293B",  // Slate 800
        text: "#334155",       // Slate 700
        muted: "#64748B",      // Slate 500
        light: "#F8FAFC",      // Slate 50
        border: "#E2E8F0",     // Slate 200
        white: "#FFFFFF",
        accent: "#F59E0B"      // Amber
      };

      // --- ENCABEZADO ---
      doc.rect(0, 0, doc.page.width, 100).fill(ui.secondary);
      doc.rect(0, 97, doc.page.width, 3).fill(ui.accent);

      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(22).text("HOTEL RESIDENCY CLUB", 60, 35);
      doc.fontSize(10).font("Helvetica").fillColor("#94A3B8").text("Comprobante de Venta — Tienda", 60, 60);

      // Badge Folio
      doc.rect(400, 35, 140, 35, 5).fill(ui.primary);
      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(11).text(`FOLIO: #${venta.id}`, 400, 47, { width: 140, align: "center" });

      let currentY = 130;

      // --- INFORMACIÓN ---
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(14).text("Detalles de la Operación", 60, currentY);
      currentY += 25;

      const info = [
        { label: "Fecha:", val: new Date(venta.fecha_venta).toLocaleString('es-MX') },
        { label: "Cliente:", val: venta.nombre_cliente || "Público General" },
        { label: "Atendido por:", val: venta.usuario || "Sistema" },
        { label: "Método de Pago:", val: venta.tipo_pago.toUpperCase() }
      ];

      info.forEach(item => {
        doc.fillColor(ui.muted).font("Helvetica").fontSize(9).text(item.label, 60, currentY);
        doc.fillColor(ui.text).font("Helvetica-Bold").fontSize(10).text(item.val, 160, currentY);
        currentY += 18;
      });

      currentY += 25;

      // --- TABLA ---
      doc.rect(60, currentY, 480, 25).fill(ui.light);
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(9);
      doc.text("PRODUCTO", 75, currentY + 8);
      doc.text("CANT.", 280, currentY + 8, { width: 40, align: "center" });
      doc.text("PRECIO", 330, currentY + 8, { width: 80, align: "right" });
      doc.text("SUBTOTAL", 430, currentY + 8, { width: 90, align: "right" });

      currentY += 25;

      venta.productos.forEach((p, i) => {
        doc.fillColor(ui.text).font("Helvetica").fontSize(9);
        doc.text(p.producto_nombre, 75, currentY + 10, { width: 200, ellipsis: true });
        doc.text(p.cantidad.toString(), 280, currentY + 10, { width: 40, align: "center" });
        doc.text(`$${Number(p.precio_unitario).toFixed(2)}`, 330, currentY + 10, { width: 80, align: "right" });
        doc.fillColor(ui.secondary).font("Helvetica-Bold").text(`$${Number(p.subtotal).toFixed(2)}`, 430, currentY + 10, { width: 90, align: "right" });
        currentY += 25;
        doc.rect(60, currentY, 480, 0.5).fill(ui.border);
      });

      // --- TOTAL ---
      currentY += 20;
      doc.rect(350, currentY, 190, 40, 5).fill(ui.primary);
      doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(14).text("TOTAL:", 365, currentY + 12);
      doc.text(`$${Number(venta.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 410, currentY + 12, { width: 120, align: "right" });

      if (qrPath && fs.existsSync(qrPath)) {
        currentY += 60;
        doc.image(qrPath, (doc.page.width - 80) / 2, currentY, { width: 80 });
      }

      const footerY = doc.page.height - 60;
      doc.fillColor(ui.muted).font("Helvetica").fontSize(8).text("Hotel Residency Club — Comprobante de Venta", 0, footerY, { align: "center", width: doc.page.width });

      doc.end();
      stream.on("finish", () => resolve(rutaAbsoluta));
      stream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};
