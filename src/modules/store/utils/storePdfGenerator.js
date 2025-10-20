import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "../../rooms/utils/validadorDirectorios.js";

export const generateSalePDF = async (venta, qrPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Validar y obtener ruta organizada
      const rutaBase = validadorDirectorios.obtenerRuta("pdf", "ventas");
      const fileName = `comprobante_venta_${venta.id}_${Date.now()}.pdf`;
      const filePath = path.join(rutaBase, fileName);

      console.log("=== GENERANDO PDF DE VENTA ===");
      console.log("Venta ID:", venta.id);
      console.log("Ruta destino:", filePath);

      // Validar que el directorio existe
      if (!validadorDirectorios.validarRutaEspecifica("pdf", "ventas")) {
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
      };

      // ===== ENCABEZADO =====
      doc.rect(0, 0, doc.page.width, 100).fill(colors.primary);
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

      // Badge de tipo de comprobante
      const badgeWidth = 260;
      const badgeX = (doc.page.width - badgeWidth) / 2;
      
      doc.roundedRect(badgeX, 60, badgeWidth, 30, 5).fill(colors.white);
      
      doc
        .fontSize(16)
        .fillColor(colors.primary)
        .font("Helvetica-Bold")
        .text("COMPROBANTE DE VENTA", badgeX, 68, {
          width: badgeWidth,
          align: "center",
        });

      // ===== INFORMACIÓN DE LA VENTA =====
      let yPos = 130;

      // Sección de información general
      doc
        .fontSize(12)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text("INFORMACIÓN DE LA VENTA", 50, yPos);

      yPos += 25;

      // Tabla de información
      const infoData = [
        { label: "Folio:", value: `#${venta.id}` },
        { label: "Fecha:", value: new Date(venta.fecha_venta).toLocaleString('es-MX') },
        { label: "Cliente:", value: venta.nombre_cliente || "Cliente General" },
        { label: "Atendido por:", value: venta.usuario },
        { label: "Tipo de Pago:", value: venta.tipo_pago.toUpperCase() },
      ];

      infoData.forEach((item) => {
        doc
          .fontSize(10)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text(item.label, 50, yPos, { width: 150 });

        doc
          .fontSize(10)
          .fillColor(colors.dark)
          .font("Helvetica-Bold")
          .text(item.value, 200, yPos, { width: 350 });

        yPos += 20;
      });

      yPos += 10;

      // ===== PRODUCTOS =====
      doc
        .fontSize(12)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text("PRODUCTOS", 50, yPos);

      yPos += 25;

      // Encabezado de tabla
      doc.rect(50, yPos, doc.page.width - 100, 25).fill(colors.lightGray);

      doc
        .fontSize(9)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text("PRODUCTO", 60, yPos + 8, { width: 200 })
        .text("CANT.", 270, yPos + 8, { width: 50, align: "center" })
        .text("PRECIO", 330, yPos + 8, { width: 80, align: "right" })
        .text("SUBTOTAL", 420, yPos + 8, { width: 100, align: "right" });

      yPos += 30;

      // Productos
      let subtotalGeneral = 0;

      venta.productos.forEach((producto, index) => {
        const bgColor = index % 2 === 0 ? colors.white : colors.light;
        doc.rect(50, yPos, doc.page.width - 100, 25).fill(bgColor);

        doc
          .fontSize(9)
          .fillColor(colors.dark)
          .font("Helvetica")
          .text(producto.producto_nombre, 60, yPos + 8, { width: 200 })
          .text(producto.cantidad.toString(), 270, yPos + 8, { width: 50, align: "center" })
          .text(`$${parseFloat(producto.precio_unitario).toFixed(2)}`, 330, yPos + 8, { width: 80, align: "right" })
          .text(`$${parseFloat(producto.subtotal).toFixed(2)}`, 420, yPos + 8, { width: 100, align: "right" });

        subtotalGeneral += parseFloat(producto.subtotal);
        yPos += 25;
      });

      yPos += 10;

      // ===== TOTALES =====
      // Línea divisoria
      doc
        .moveTo(50, yPos)
        .lineTo(doc.page.width - 50, yPos)
        .strokeColor(colors.gray)
        .lineWidth(1)
        .stroke();

      yPos += 15;

      // Total
      doc.rect(350, yPos, doc.page.width - 400, 35).fill(colors.success);

      doc
        .fontSize(14)
        .fillColor(colors.white)
        .font("Helvetica-Bold")
        .text("TOTAL:", 360, yPos + 10)
        .text(`$${parseFloat(venta.total).toFixed(2)}`, 420, yPos + 10, { width: 100, align: "right" });

      yPos += 50;

      // Total en letras
      if (venta.total_letras) {
        doc
          .fontSize(9)
          .fillColor(colors.gray)
          .font("Helvetica-Oblique")
          .text(`(${venta.total_letras})`, 50, yPos, {
            width: doc.page.width - 100,
            align: "center",
          });

        yPos += 25;
      }

      // ===== CÓDIGO QR =====
      if (qrPath && fs.existsSync(qrPath)) {
        yPos += 20;
        
        doc
          .fontSize(10)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text("Escanea para verificar:", 50, yPos, { align: "center", width: doc.page.width - 100 });

        yPos += 20;

        const qrSize = 100;
        const qrX = (doc.page.width - qrSize) / 2;
        doc.image(qrPath, qrX, yPos, { width: qrSize, height: qrSize });

        yPos += qrSize + 20;
      }

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
        .text("Gracias por su compra", 50, footerY + 15, {
          width: doc.page.width - 100,
          align: "center",
        });

      doc
        .fontSize(7)
        .fillColor(colors.gray)
        .text("Este documento es un comprobante de venta", 50, footerY + 30, {
          width: doc.page.width - 100,
          align: "center",
        });

      doc
        .fontSize(7)
        .fillColor(colors.gray)
        .text(`Generado el ${new Date().toLocaleString('es-MX')}`, 50, footerY + 45, {
          width: doc.page.width - 100,
          align: "center",
        });

      // Finalizar documento
      doc.end();

      doc.on("finish", () => {
        console.log("✅ PDF de venta generado exitosamente:", filePath);
        resolve(filePath);
      });

      doc.on("error", (error) => {
        console.error("❌ Error al generar PDF de venta:", error);
        reject(error);
      });
    } catch (error) {
      console.error("❌ Error en generateSalePDF:", error);
      reject(error);
    }
  });
};
