import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "./validadorDirectorios.js";

/**
 * Genera reportes de administración de Habitaciones (Rentas/Reservaciones/Consolidado).
 * Optimizado para diseño Indigo Corporativo y sin páginas extra.
 */
export const generateReportPDF = async (reporte) => {
  return new Promise((resolve, reject) => {
    try {
      const rutaBase = validadorDirectorios.obtenerRuta("pdf", "reportes");
      const periodoLabel = reporte.periodo ? reporte.periodo.toLowerCase() : "habitaciones";
      const fileName = `Reporte_${reporte.tipo}_${periodoLabel}_${Date.now()}.pdf`;
      const filePath = path.join(rutaBase, fileName);

      if (!validadorDirectorios.validarRutaEspecifica("pdf", "reportes")) {
        throw new Error(`Error de acceso al directorio de reportes`);
      }

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 30, left: 50, right: 50 },
        bufferPages: true
      });

      const stream = fs.createWriteStream(filePath);
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
        doc.fontSize(9).font("Helvetica").fillColor("#94A3B8").text("Control Operativo — Habitación y Estancia", 50, 58);

        const titulo = `REPORTE ${reporte.periodo ? reporte.periodo.toUpperCase() : "DE HABITACIONES"}`;
        doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(12).text(titulo, 0, 40, { align: "right", width: doc.page.width - 50 });
        doc.fontSize(8).font("Helvetica").fillColor("#CBD5E1").text(`${reporte.fechaInicio} al ${reporte.fechaFin}`, 0, 58, { align: "right", width: doc.page.width - 50 });
      };

      const dibujarPiePagina = (pageNum, total) => {
        doc.rect(50, doc.page.height - 50, 495, 0.5).fill(ui.border);
        doc.fillColor(ui.muted).fontSize(7).font("Helvetica");
        doc.text("Hotel Residency Club — Reporte de Gestión Interna", 50, doc.page.height - 40);
        doc.text(`Página ${pageNum} de ${total}`, 0, doc.page.height - 40, { align: "right", width: doc.page.width - 50 });
      };

      // --- CONTENIDO ---
      dibujarEncabezado();
      let currentY = 130;

      // Resumen Ejecutivo
      doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(15).text("Resumen Ejecutivo", 50, currentY);
      currentY += 25;

      const items = [];
      if (reporte.tipo === "rentas") {
        items.push({ l: "Rentas Totales", v: reporte.estadisticas.totalRentas, c: ui.primary });
        items.push({ l: "Ingreso Total", v: `$${Number(reporte.estadisticas.totalIngresos).toLocaleString()}`, c: ui.success });
        items.push({ l: "Ticket Promedio", v: `$${Number(reporte.estadisticas.promedioIngreso).toLocaleString()}`, c: ui.accent });
      } else if (reporte.tipo === "reservaciones") {
        items.push({ l: "Reservaciones", v: reporte.estadisticas.totalReservaciones, c: ui.primary });
        items.push({ l: "Recaudado (Enganche)", v: `$${Number(reporte.estadisticas.totalEnganche).toLocaleString()}`, c: ui.success });
        items.push({ l: "Pendiente Cobro", v: `$${Number(reporte.estadisticas.pendientePorCobrar).toLocaleString()}`, c: ui.accent });
      } else if (reporte.tipo === "consolidado") {
        items.push({ l: "Operaciones", v: reporte.estadisticas.totalOperaciones, c: ui.primary });
        items.push({ l: "Ingresos Reales", v: `$${Number(reporte.estadisticas.ingresosReales).toLocaleString()}`, c: ui.success });
        items.push({ l: "Proyección Total", v: `$${Number(reporte.estadisticas.totalGeneral).toLocaleString()}`, c: ui.accent });
      }

      let cardX = 50;
      items.forEach(card => {
        doc.roundedRect(cardX, currentY, 158, 65, 8).fillAndStroke(ui.light, ui.border);
        doc.fillColor(ui.muted).font("Helvetica").fontSize(8).text(card.l.toUpperCase(), cardX, currentY + 15, { width: 158, align: "center" });
        doc.fillColor(card.c).font("Helvetica-Bold").fontSize(15).text(card.v, cardX, currentY + 32, { width: 158, align: "center" });
        cardX += 168;
      });

      currentY += 95;

      // Tablas de Detalle
      const dibujarTabla = (titulo, datos, headers, wrap = false) => {
        if (!datos || datos.length === 0) return;

        if (currentY > doc.page.height - 120) { doc.addPage(); dibujarEncabezado(); currentY = 120; }

        doc.fillColor(ui.secondary).font("Helvetica-Bold").fontSize(13).text(titulo, 50, currentY);
        currentY += 20;

        const dibujarCabecera = (y) => {
          doc.rect(50, y, 495, 22).fill(ui.secondary);
          doc.fillColor(ui.white).font("Helvetica-Bold").fontSize(8);
          headers.forEach(h => {
            doc.text(h.label, h.x, h.y + y, { width: h.w, align: h.align || "left" });
          });
        };

        dibujarCabecera(currentY);
        currentY += 22;

        datos.forEach((item, idx) => {
          if (currentY > doc.page.height - 60) {
            doc.addPage(); dibujarEncabezado(); currentY = 120; dibujarCabecera(currentY); currentY += 22;
          }
          if (idx % 2 !== 0) doc.rect(50, currentY, 495, 22).fill(ui.light);
          doc.fillColor(ui.text).font("Helvetica").fontSize(8);

          headers.forEach(h => {
            let val = h.key.split('.').reduce((o, i) => o[i], item);
            if (h.format === 'currency') val = `$${Number(val).toLocaleString()}`;
            if (h.format === 'date') val = new Date(val).toLocaleDateString('es-MX');
            doc.text(String(val || ""), h.x, currentY + 7, { width: h.w, ellipsis: true, align: h.align || "left" });
          });
          currentY += 22;
        });
        currentY += 25;
      };

      if (reporte.tipo === "rentas") {
        dibujarTabla("Detalle de Rentas", reporte.datos, [
          { label: "CLIENTE", x: 65, y: 7, w: 200, key: "nombre_cliente" },
          { label: "HAB.", x: 270, y: 7, w: 50, key: "numero_habitacion", align: "center" },
          { label: "PAGO", x: 330, y: 7, w: 80, key: "tipo_pago" },
          { label: "MONTO", x: 420, y: 7, w: 115, key: "monto", format: "currency", align: "right" }
        ]);
      } else if (reporte.tipo === "reservaciones") {
        dibujarTabla("Detalle de Reservaciones", reporte.datos, [
          { label: "CLIENTE", x: 65, y: 7, w: 180, key: "nombre_cliente" },
          { label: "HAB.", x: 250, y: 7, w: 40, key: "numero_habitacion", align: "center" },
          { label: "PROX. INGRESO", x: 300, y: 7, w: 80, key: "fecha_ingreso", format: "date" },
          { label: "TOTAL", x: 390, y: 7, w: 70, key: "monto", format: "currency", align: "right" },
          { label: "ANT.", x: 465, y: 7, w: 70, key: "enganche", format: "currency", align: "right" }
        ]);
      } else if (reporte.tipo === "consolidado") {
        dibujarTabla("Detalle de Rentas", reporte.rentas.datos, [
          { label: "CLIENTE", x: 65, y: 7, w: 200, key: "nombre_cliente" },
          { label: "HAB.", x: 270, y: 7, w: 50, key: "numero_habitacion", align: "center" },
          { label: "PAGO", x: 330, y: 7, w: 80, key: "tipo_pago" },
          { label: "TOTAL", x: 420, y: 7, w: 115, key: "monto", format: "currency", align: "right" }
        ]);
        dibujarTabla("Detalle de Reservaciones", reporte.reservaciones.datos, [
          { label: "CLIENTE", x: 65, y: 7, w: 180, key: "nombre_cliente" },
          { label: "HAB.", x: 250, y: 7, w: 40, key: "numero_habitacion", align: "center" },
          { label: "PROX. INGRESO", x: 300, y: 7, w: 80, key: "fecha_ingreso", format: "date" },
          { label: "TOTAL", x: 390, y: 7, w: 70, key: "monto", format: "currency", align: "right" },
          { label: "REC.", x: 465, y: 7, w: 70, key: "enganche", format: "currency", align: "right" }
        ]);
      }

      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        dibujarPiePagina(i + 1, range.count);
      }

      doc.end();
      stream.on("finish", () => resolve(filePath));
    } catch (error) {
      reject(error);
    }
  });
};
