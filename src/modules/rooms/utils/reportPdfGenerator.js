import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "./validadorDirectorios.js";

/**
 * Genera un PDF profesional para reportes de rentas/reservaciones
 * @param {Object} reporte - Datos del reporte
 * @returns {Promise<string>} - Ruta del archivo PDF generado
 */
export const generateReportPDF = async (reporte) => {
  return new Promise((resolve, reject) => {
    try {
      // Validar y obtener ruta para reportes
      const rutaBase = validadorDirectorios.obtenerRuta("pdf", "reportes");
      const fileName = `reporte_${reporte.tipo}_${Date.now()}.pdf`;
      const filePath = path.join(rutaBase, fileName);

      console.log("=== GENERANDO PDF DE REPORTE ===");
      console.log("Tipo:", reporte.tipo);
      console.log("Período:", reporte.fechaInicio, "-", reporte.fechaFin);
      console.log("Ruta destino:", filePath);

      // Validar que el directorio existe
      if (!validadorDirectorios.validarRutaEspecifica("pdf", "reportes")) {
        throw new Error(`No se pudo validar/crear el directorio para reportes PDF`);
      }

      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // === ENCABEZADO ===
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#1e3a8a")
        .text("HOTEL RESIDENCIAL CLUB", { align: "center" });

      doc
        .moveDown(0.5)
        .fontSize(18)
        .fillColor("#3b82f6")
        .text(`REPORTE DE ${reporte.tipo.toUpperCase()}`, { align: "center" });

      doc
        .moveDown(0.3)
        .fontSize(10)
        .fillColor("#6b7280")
        .text(
          `Período: ${formatDate(reporte.fechaInicio)} - ${formatDate(reporte.fechaFin)}`,
          { align: "center" }
        );

      doc
        .moveDown(0.2)
        .text(`Generado: ${new Date().toLocaleString("es-MX")}`, {
          align: "center",
        });

      // Línea separadora
      doc
        .moveDown(1)
        .strokeColor("#3b82f6")
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(1.5);

      // === ESTADÍSTICAS ===
      if (reporte.tipo === "rentas") {
        drawRentasStats(doc, reporte.estadisticas);
        doc.moveDown(2);
        drawRentasTable(doc, reporte.datos);
      } else if (reporte.tipo === "reservaciones") {
        drawReservacionesStats(doc, reporte.estadisticas);
        doc.moveDown(2);
        drawReservacionesTable(doc, reporte.datos);
      } else if (reporte.tipo === "consolidado") {
        drawConsolidadoStats(doc, reporte);
        doc.moveDown(2);
        drawConsolidadoSummary(doc, reporte);
      }

      // === PIE DE PÁGINA ===
      doc
        .moveDown(3)
        .fontSize(8)
        .fillColor("#9ca3af")
        .text(
          "Este documento fue generado automáticamente por el sistema de gestión del Hotel Residencial Club",
          { align: "center" }
        );

      doc.end();

      stream.on("finish", () => {
        console.log("✅ PDF de reporte generado exitosamente:", filePath);
        resolve(filePath);
      });

      stream.on("error", (error) => {
        console.error("❌ Error al escribir PDF:", error);
        reject(error);
      });
    } catch (error) {
      console.error("❌ Error al generar PDF de reporte:", error);
      reject(error);
    }
  });
};

// === FUNCIONES AUXILIARES ===

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

// Dibujar estadísticas de RENTAS
function drawRentasStats(doc, stats) {
  doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("📊 ESTADÍSTICAS");

  doc.moveDown(0.5);

  const startY = doc.y;
  const boxWidth = 150;
  const boxHeight = 60;
  const gap = 20;

  // Total Rentas
  drawStatBox(doc, 50, startY, boxWidth, boxHeight, "Total Rentas", stats.totalRentas.toString(), "#3b82f6");

  // Ingreso Total
  drawStatBox(
    doc,
    50 + boxWidth + gap,
    startY,
    boxWidth,
    boxHeight,
    "Ingreso Total",
    formatCurrency(stats.totalIngresos),
    "#10b981"
  );

  // Promedio
  drawStatBox(
    doc,
    50 + (boxWidth + gap) * 2,
    startY,
    boxWidth,
    boxHeight,
    "Promedio por Renta",
    formatCurrency(stats.promedioIngreso),
    "#8b5cf6"
  );

  doc.y = startY + boxHeight + 20;
}

// Dibujar estadísticas de RESERVACIONES
function drawReservacionesStats(doc, stats) {
  doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("📊 ESTADÍSTICAS");

  doc.moveDown(0.5);

  const startY = doc.y;
  const boxWidth = 120;
  const boxHeight = 60;
  const gap = 15;

  drawStatBox(doc, 50, startY, boxWidth, boxHeight, "Total", stats.totalReservaciones.toString(), "#10b981");
  drawStatBox(doc, 50 + (boxWidth + gap), startY, boxWidth, boxHeight, "Monto Esperado", formatCurrency(stats.totalMontoEsperado), "#3b82f6");
  drawStatBox(doc, 50 + (boxWidth + gap) * 2, startY, boxWidth, boxHeight, "Enganche", formatCurrency(stats.totalEnganche), "#f59e0b");
  drawStatBox(doc, 50 + (boxWidth + gap) * 3, startY, boxWidth, boxHeight, "Pendiente", formatCurrency(stats.pendientePorCobrar), "#ef4444");

  doc.y = startY + boxHeight + 20;
}

// Dibujar estadísticas CONSOLIDADAS
function drawConsolidadoStats(doc, reporte) {
  doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("📊 ESTADÍSTICAS GENERALES");

  doc.moveDown(0.5);

  const startY = doc.y;
  const boxWidth = 120;
  const boxHeight = 60;
  const gap = 15;

  drawStatBox(doc, 50, startY, boxWidth, boxHeight, "Operaciones", reporte.estadisticas.totalOperaciones.toString(), "#6366f1");
  drawStatBox(doc, 50 + (boxWidth + gap), startY, boxWidth, boxHeight, "Ingresos Reales", formatCurrency(reporte.estadisticas.ingresosReales), "#10b981");
  drawStatBox(doc, 50 + (boxWidth + gap) * 2, startY, boxWidth, boxHeight, "Ingresos Esperados", formatCurrency(reporte.estadisticas.ingresosEsperados), "#f59e0b");
  drawStatBox(doc, 50 + (boxWidth + gap) * 3, startY, boxWidth, boxHeight, "Total General", formatCurrency(reporte.estadisticas.totalGeneral), "#8b5cf6");

  doc.y = startY + boxHeight + 20;
}

// Dibujar caja de estadística
function drawStatBox(doc, x, y, width, height, label, value, color) {
  // Fondo
  doc.rect(x, y, width, height).fillAndStroke(color + "20", color);

  // Label
  doc
    .fontSize(9)
    .fillColor("#6b7280")
    .font("Helvetica")
    .text(label, x + 10, y + 10, { width: width - 20, align: "center" });

  // Valor
  doc
    .fontSize(16)
    .fillColor(color)
    .font("Helvetica-Bold")
    .text(value, x + 10, y + 28, { width: width - 20, align: "center" });
}

// Dibujar tabla de RENTAS
function drawRentasTable(doc, datos) {
  if (datos.length === 0) {
    doc.fontSize(12).fillColor("#6b7280").text("No hay rentas en este período", { align: "center" });
    return;
  }

  doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("📋 DETALLE DE RENTAS");
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colWidths = [120, 80, 80, 80, 80, 80];
  const headers = ["Cliente", "Habitación", "Check-in", "Check-out", "Tipo Pago", "Monto"];

  // Encabezados
  let xPos = 50;
  headers.forEach((header, i) => {
    doc
      .fontSize(9)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .rect(xPos, tableTop, colWidths[i], 20)
      .fill("#3b82f6")
      .fillColor("#ffffff")
      .text(header, xPos + 5, tableTop + 6, { width: colWidths[i] - 10, align: "center" });
    xPos += colWidths[i];
  });

  // Filas
  let yPos = tableTop + 20;
  datos.forEach((renta, index) => {
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }

    const bgColor = index % 2 === 0 ? "#f9fafb" : "#ffffff";
    xPos = 50;

    // Fondo de fila
    doc.rect(50, yPos, colWidths.reduce((a, b) => a + b, 0), 25).fill(bgColor);

    // Datos
    const rowData = [
      renta.nombre_cliente,
      `${renta.numero_habitacion}\n(${renta.tipo_habitacion})`,
      new Date(renta.fecha_ingreso).toLocaleDateString("es-MX"),
      new Date(renta.fecha_salida).toLocaleDateString("es-MX"),
      renta.tipo_pago,
      formatCurrency(renta.monto),
    ];

    rowData.forEach((data, i) => {
      doc
        .fontSize(8)
        .fillColor("#374151")
        .font("Helvetica")
        .text(data, xPos + 5, yPos + 5, { width: colWidths[i] - 10, align: i >= 2 ? "center" : "left" });
      xPos += colWidths[i];
    });

    yPos += 25;
  });

  doc.y = yPos + 10;
}

// Dibujar tabla de RESERVACIONES
function drawReservacionesTable(doc, datos) {
  if (datos.length === 0) {
    doc.fontSize(12).fillColor("#6b7280").text("No hay reservaciones en este período", { align: "center" });
    return;
  }

  doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("📋 DETALLE DE RESERVACIONES");
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colWidths = [100, 70, 90, 70, 70, 70];
  const headers = ["Cliente", "Habitación", "Fechas", "Monto", "Enganche", "Pendiente"];

  // Encabezados
  let xPos = 50;
  headers.forEach((header, i) => {
    doc
      .fontSize(9)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .rect(xPos, tableTop, colWidths[i], 20)
      .fill("#10b981")
      .fillColor("#ffffff")
      .text(header, xPos + 5, tableTop + 6, { width: colWidths[i] - 10, align: "center" });
    xPos += colWidths[i];
  });

  // Filas
  let yPos = tableTop + 20;
  datos.forEach((reserva, index) => {
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }

    const bgColor = index % 2 === 0 ? "#f0fdf4" : "#ffffff";
    xPos = 50;

    doc.rect(50, yPos, colWidths.reduce((a, b) => a + b, 0), 30).fill(bgColor);

    const rowData = [
      reserva.nombre_cliente,
      `${reserva.numero_habitacion}\n(${reserva.tipo_habitacion})`,
      `${new Date(reserva.fecha_ingreso).toLocaleDateString("es-MX")}\n${new Date(reserva.fecha_salida).toLocaleDateString("es-MX")}`,
      formatCurrency(reserva.monto),
      formatCurrency(reserva.enganche || 0),
      formatCurrency(reserva.monto - (reserva.enganche || 0)),
    ];

    rowData.forEach((data, i) => {
      doc
        .fontSize(8)
        .fillColor("#374151")
        .font("Helvetica")
        .text(data, xPos + 5, yPos + 5, { width: colWidths[i] - 10, align: i >= 3 ? "right" : "left" });
      xPos += colWidths[i];
    });

    yPos += 30;
  });

  doc.y = yPos + 10;
}

// Dibujar resumen CONSOLIDADO
function drawConsolidadoSummary(doc, reporte) {
  doc.fontSize(14).fillColor("#1f2937").font("Helvetica-Bold").text("📊 RESUMEN DETALLADO");
  doc.moveDown(0.5);

  // Rentas
  doc
    .fontSize(12)
    .fillColor("#3b82f6")
    .font("Helvetica-Bold")
    .text(`🏨 RENTAS (${reporte.rentas.estadisticas.totalRentas})`);
  doc
    .fontSize(10)
    .fillColor("#374151")
    .font("Helvetica")
    .text(`• Ingresos: ${formatCurrency(reporte.rentas.estadisticas.totalIngresos)}`);
  doc.text(`• Promedio: ${formatCurrency(reporte.rentas.estadisticas.promedioIngreso)}`);

  doc.moveDown(1);

  // Reservaciones
  doc
    .fontSize(12)
    .fillColor("#10b981")
    .font("Helvetica-Bold")
    .text(`📅 RESERVACIONES (${reporte.reservaciones.estadisticas.totalReservaciones})`);
  doc
    .fontSize(10)
    .fillColor("#374151")
    .font("Helvetica")
    .text(`• Monto Esperado: ${formatCurrency(reporte.reservaciones.estadisticas.totalMontoEsperado)}`);
  doc.text(`• Enganche Recibido: ${formatCurrency(reporte.reservaciones.estadisticas.totalEnganche)}`);
  doc.text(`• Pendiente por Cobrar: ${formatCurrency(reporte.reservaciones.estadisticas.pendientePorCobrar)}`);
}

export default { generateReportPDF };
