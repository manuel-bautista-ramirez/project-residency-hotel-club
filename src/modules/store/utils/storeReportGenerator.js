import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "../../rooms/utils/validadorDirectorios.js";

export const generateReportPDF = async (reporte) => {
  return new Promise((resolve, reject) => {
    try {
      // Validar y obtener ruta organizada
      const rutaBase = validadorDirectorios.obtenerRuta("pdf", "reportes");
      const fileName = `reporte_ventas_${reporte.fechaInicio}_${reporte.fechaFin}_${Date.now()}.pdf`;
      const filePath = path.join(rutaBase, fileName);

      console.log("=== GENERANDO REPORTE PDF ===");
      console.log("Período:", `${reporte.fechaInicio} - ${reporte.fechaFin}`);
      console.log("Ruta destino:", filePath);

      // Validar que el directorio existe
      if (!validadorDirectorios.validarRutaEspecifica("pdf", "reportes")) {
        throw new Error(`No se pudo validar/crear el directorio para PDF: ${rutaBase}`);
      }

      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 30,
          bottom: 30,
          left: 40,
          right: 40,
        },
      });

      doc.pipe(fs.createWriteStream(filePath));

      // Colores corporativos
      const colors = {
        primary: "#1a4d8f",
        primaryLight: "#2c5aa0",
        secondary: "#2c3e50",
        success: "#27ae60",
        successLight: "#2ecc71",
        warning: "#f39c12",
        danger: "#e74c3c",
        light: "#f8f9fa",
        lightGray: "#ecf0f1",
        dark: "#2c3e50",
        gray: "#7f8c8d",
        white: "#ffffff",
        gold: "#f1c40f",
        purple: "#9b59b6",
      };

      // ===== ENCABEZADO =====
      doc.rect(0, 0, doc.page.width, 100).fill(colors.purple);
      doc.rect(0, 0, doc.page.width, 100).fillOpacity(0.1).fill(colors.primaryLight);
      doc.fillOpacity(1);

      // Borde decorativo superior
      doc.rect(0, 0, doc.page.width, 4).fill(colors.gold);

      // Nombre del hotel
      doc
        .fontSize(20)
        .fillColor(colors.white)
        .font("Helvetica-Bold")
        .text("HOTEL RESIDENCY CLUB", 50, 20);

      doc
        .fontSize(9)
        .fillColor(colors.lightGray)
        .font("Helvetica")
        .text("Tu hogar lejos de casa", 50, 42);

      // Badge de tipo de reporte
      const badgeWidth = 280;
      const badgeX = (doc.page.width - badgeWidth) / 2;
      
      doc.roundedRect(badgeX, 60, badgeWidth, 30, 5).fill(colors.white);
      
      doc
        .fontSize(16)
        .fillColor(colors.purple)
        .font("Helvetica-Bold")
        .text("REPORTE DE VENTAS", badgeX, 68, {
          width: badgeWidth,
          align: "center",
        });

      // ===== PERÍODO DEL REPORTE =====
      let yPos = 130;

      doc
        .fontSize(11)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text(`Período: ${reporte.fechaInicio} al ${reporte.fechaFin}`, 50, yPos, {
          width: doc.page.width - 100,
          align: "center",
        });

      yPos += 30;

      // ===== ESTADÍSTICAS GENERALES =====
      doc
        .fontSize(12)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text("RESUMEN GENERAL", 50, yPos);

      yPos += 25;

      // Cuadros de estadísticas
      const stats = [
        {
          label: "Total de Ventas",
          value: reporte.estadisticas.totalVentas.toString(),
          color: colors.primary,
        },
        {
          label: "Ingresos Totales",
          value: `$${reporte.estadisticas.totalIngresos.toFixed(2)}`,
          color: colors.success,
        },
        {
          label: "Promedio por Venta",
          value: `$${reporte.estadisticas.promedioVenta.toFixed(2)}`,
          color: colors.purple,
        },
      ];

      const boxWidth = 150;
      const boxHeight = 60;
      const spacing = 20;
      let xPos = 50;

      stats.forEach((stat) => {
        // Caja con borde de color
        doc.rect(xPos, yPos, boxWidth, boxHeight).fill(colors.light);
        doc.rect(xPos, yPos, boxWidth, 5).fill(stat.color);

        doc
          .fontSize(9)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text(stat.label, xPos + 10, yPos + 15, { width: boxWidth - 20, align: "center" });

        doc
          .fontSize(16)
          .fillColor(stat.color)
          .font("Helvetica-Bold")
          .text(stat.value, xPos + 10, yPos + 32, { width: boxWidth - 20, align: "center" });

        xPos += boxWidth + spacing;
      });

      yPos += boxHeight + 30;

      // ===== VENTAS POR TIPO DE PAGO =====
      doc
        .fontSize(12)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text("VENTAS POR TIPO DE PAGO", 50, yPos);

      yPos += 25;

      const paymentTypes = [
        { label: "Efectivo", value: reporte.estadisticas.ventasPorTipoPago.efectivo, icon: "💵" },
        { label: "Transferencia", value: reporte.estadisticas.ventasPorTipoPago.transferencia, icon: "🏦" },
        { label: "Tarjeta", value: reporte.estadisticas.ventasPorTipoPago.tarjeta, icon: "💳" },
      ];

      paymentTypes.forEach((type) => {
        doc.rect(50, yPos, doc.page.width - 100, 25).fill(colors.light);

        doc
          .fontSize(10)
          .fillColor(colors.dark)
          .font("Helvetica")
          .text(`${type.icon} ${type.label}`, 60, yPos + 8, { width: 200 });

        doc
          .fontSize(11)
          .fillColor(colors.success)
          .font("Helvetica-Bold")
          .text(`$${type.value.toFixed(2)}`, 300, yPos + 8, { width: 200, align: "right" });

        yPos += 30;
      });

      yPos += 20;

      // ===== PRODUCTOS MÁS VENDIDOS =====
      doc
        .fontSize(12)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text("TOP 10 PRODUCTOS MÁS VENDIDOS", 50, yPos);

      yPos += 25;

      // Encabezado de tabla
      doc.rect(50, yPos, doc.page.width - 100, 25).fill(colors.lightGray);

      doc
        .fontSize(9)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text("#", 60, yPos + 8, { width: 30 })
        .text("PRODUCTO", 100, yPos + 8, { width: 200 })
        .text("CATEGORÍA", 310, yPos + 8, { width: 100 })
        .text("VENDIDOS", 420, yPos + 8, { width: 100, align: "right" });

      yPos += 30;

      // Lista de productos (máximo 10)
      const topProducts = reporte.productosMasVendidos.slice(0, 10);

      topProducts.forEach((producto, index) => {
        const bgColor = index % 2 === 0 ? colors.white : colors.light;
        doc.rect(50, yPos, doc.page.width - 100, 25).fill(bgColor);

        doc
          .fontSize(9)
          .fillColor(colors.dark)
          .font("Helvetica-Bold")
          .text(`${index + 1}`, 60, yPos + 8, { width: 30 });

        doc
          .fontSize(9)
          .fillColor(colors.dark)
          .font("Helvetica")
          .text(producto.nombre, 100, yPos + 8, { width: 200 })
          .text(producto.categoria, 310, yPos + 8, { width: 100 })
          .text(`${producto.total_vendido} uds`, 420, yPos + 8, { width: 100, align: "right" });

        yPos += 25;

        // Si llegamos al final de la página, crear nueva página
        if (yPos > doc.page.height - 150 && index < topProducts.length - 1) {
          doc.addPage();
          yPos = 50;
        }
      });

      // ===== PIE DE PÁGINA =====
      const footerY = doc.page.height - 80;

      // Línea decorativa
      doc
        .moveTo(50, footerY)
        .lineTo(doc.page.width - 50, footerY)
        .strokeColor(colors.lightGray)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(8)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("Hotel Residency Club - Reporte de Ventas", 50, footerY + 15, {
          width: doc.page.width - 100,
          align: "center",
        });

      doc
        .fontSize(7)
        .fillColor(colors.gray)
        .text(`Generado el ${new Date().toLocaleString('es-MX')}`, 50, footerY + 30, {
          width: doc.page.width - 100,
          align: "center",
        });

      // Finalizar documento
      doc.end();

      doc.on("finish", () => {
        console.log("✅ Reporte PDF generado exitosamente:", filePath);
        resolve(filePath);
      });

      doc.on("error", (error) => {
        console.error("❌ Error al generar reporte PDF:", error);
        reject(error);
      });
    } catch (error) {
      console.error("❌ Error en generateReportPDF:", error);
      reject(error);
    }
  });
};
