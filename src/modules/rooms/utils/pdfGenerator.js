import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from "./validadorDirectorios.js";

export const generateAndSendPDF = async (datos, tipo, qrPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Validar tipo de documento
      const normalizedTipo = tipo.toLowerCase();

      // Mapeo consistente de tipos
      const tipoMap = {
        renta: "rentas",
        reservacion: "reservaciones",
        reservation: "reservaciones",
      };

      const folderTipo = tipoMap[normalizedTipo];

      if (!folderTipo) {
        throw new Error(`Tipo de documento no válido: ${tipo}`);
      }

      // Validar y obtener ruta organizada usando el validador
      const rutaBase = validadorDirectorios.obtenerRuta("pdf", folderTipo);
      const fileName = `comprobante_${folderTipo}_${Date.now()}.pdf`;
      const filePath = path.join(rutaBase, fileName);

      console.log("=== GENERANDO PDF PROFESIONAL ===");
      console.log("Tipo:", tipo);
      console.log("Tipo normalizado:", folderTipo);
      console.log("Ruta destino:", filePath);

      // Validar que el directorio existe usando el validador
      if (!validadorDirectorios.validarRutaEspecifica("pdf", folderTipo)) {
        throw new Error(
          `No se pudo validar/crear el directorio para PDF: ${rutaBase}`
        );
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

      // Colores corporativos mejorados
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

      // ===== ENCABEZADO COMPACTO =====
      // Gradiente de fondo del encabezado
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

      // Tipo de comprobante con badge
      const tipoTexto = folderTipo === "rentas" ? "RENTA" : "RESERVACION";
      const badgeWidth = 260;
      const badgeX = (doc.page.width - badgeWidth) / 2;
      
      doc.roundedRect(badgeX, 60, badgeWidth, 30, 5)
         .fill(colors.white);
      
      doc
        .fontSize(13)
        .fillColor(colors.primary)
        .font("Helvetica-Bold")
        .text(`COMPROBANTE DE ${tipoTexto}`, badgeX, 69, {
          width: badgeWidth,
          align: "center",
        });

      // Número de referencia
      const referencia = `REF-${Date.now().toString().slice(-10)}`;

      // ===== ESTADO DE LA TRANSACCIÓN =====
      const estadoY = 110;
      
      // Badge de estado exitoso
      doc.roundedRect(40, estadoY, doc.page.width - 80, 32, 6)
         .fillAndStroke(colors.success, colors.successLight);

      doc
        .fontSize(13)
        .fillColor(colors.white)
        .font("Helvetica-Bold")
        .text("TRANSACCION EXITOSA", 0, estadoY + 10, { align: "center" });

      // ===== INFORMACIÓN DEL CLIENTE =====
      const infoClienteY = 152;
      
      // Caja con sombra simulada
      doc.rect(42, infoClienteY + 2, doc.page.width - 84, 80)
         .fillOpacity(0.1)
         .fill(colors.gray);
      doc.fillOpacity(1);
      
      doc.roundedRect(40, infoClienteY, doc.page.width - 80, 80, 6)
         .fillAndStroke(colors.light, colors.gray);

      // Encabezado de sección
      doc.rect(40, infoClienteY, doc.page.width - 80, 28)
         .fill(colors.primaryLight);
      
      doc
        .fontSize(12)
        .fillColor(colors.white)
        .font("Helvetica-Bold")
        .text("INFORMACION DEL CLIENTE", 55, infoClienteY + 8);

      const nombre =
        datos.nombre ||
        datos.client_name ||
        datos.nombre_cliente ||
        "No especificado";
      const email = datos.email || datos.correo || "No especificado";
      const telefono = datos.phone || datos.telefono || "No especificado";

      // Información con mejor espaciado
      const infoY = infoClienteY + 38;
      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("Nombre:", 55, infoY);
      
      doc
        .fontSize(10)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text(nombre, 120, infoY);

      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("Email:", 55, infoY + 14);
      
      doc
        .fontSize(10)
        .fillColor(colors.dark)
        .font("Helvetica")
        .text(email, 120, infoY + 14);

      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("Telefono:", 55, infoY + 28);
      
      doc
        .fontSize(10)
        .fillColor(colors.dark)
        .font("Helvetica")
        .text(telefono, 120, infoY + 28);

      // ===== DETALLES DE LA TRANSACCIÓN =====
      const detallesY = 242;
      
      // Caja con sombra
      doc.rect(42, detallesY + 2, doc.page.width - 84, 120)
         .fillOpacity(0.1)
         .fill(colors.gray);
      doc.fillOpacity(1);
      
      doc.roundedRect(40, detallesY, doc.page.width - 80, 120, 6)
         .fillAndStroke(colors.light, colors.gray);

      // Encabezado de sección
      doc.rect(40, detallesY, doc.page.width - 80, 28)
         .fill(colors.primaryLight);
      
      doc
        .fontSize(12)
        .fillColor(colors.white)
        .font("Helvetica-Bold")
        .text("DETALLES DE LA TRANSACCION", 55, detallesY + 8);

      const monto = datos.monto || datos.amount || datos.price || 0;
      const habitacion = datos.numero_habitacion || datos.habitacion_id || "No especificada";
      const fechaEmision = new Date().toLocaleDateString("es-MX", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const horaEmision = new Date().toLocaleTimeString("es-MX", {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Detalles con diseño de tabla
      const detY = detallesY + 38;
      const lineHeight = 20;
      
      // Monto destacado
      doc.roundedRect(55, detY, doc.page.width - 110, 24, 4)
         .fill(colors.white);
      
      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("Monto Total:", 65, detY + 6);
      
      doc
        .fontSize(12)
        .fillColor(colors.success)
        .font("Helvetica-Bold")
        .text(`$${Number(monto).toLocaleString('es-MX')} MXN`, 0, detY + 6, {
          align: "right",
          width: doc.page.width - 105
        });

      // Habitación
      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("Habitacion:", 55, detY + 32);
      
      doc
        .fontSize(10)
        .fillColor(colors.dark)
        .font("Helvetica-Bold")
        .text(habitacion, 140, detY + 32);

      // Fecha de emisión
      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("Fecha de Emision:", 55, detY + 46);
      
      doc
        .fontSize(10)
        .fillColor(colors.dark)
        .font("Helvetica")
        .text(fechaEmision, 140, detY + 46);

      // Hora de emisión
      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text("Hora de Emision:", 55, detY + 60);
      
      doc
        .fontSize(10)
        .fillColor(colors.dark)
        .font("Helvetica")
        .text(horaEmision, 140, detY + 60);

      // Datos específicos según el tipo
      if (normalizedTipo === "renta") {
        const tipoPago =
          datos.payment_type || datos.tipo_pago || "No especificado";
        const checkIn =
          datos.check_in || datos.fecha_ingreso || "No especificado";
        const checkOut =
          datos.check_out || datos.fecha_salida || "No especificado";

        // Tipo de pago
        doc
          .fontSize(10)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text("Tipo de Pago:", 55, detY + 98);
        
        doc
          .fontSize(11)
          .fillColor(colors.dark)
          .font("Helvetica-Bold")
          .text(tipoPago, 165, detY + 98);

        // Check-in
        doc
          .fontSize(10)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text("Check-in:", 55, detY + 118);
        
        doc
          .fontSize(11)
          .fillColor(colors.dark)
          .font("Helvetica")
          .text(checkIn, 165, detY + 118);

        // Check-out
        doc
          .fontSize(10)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text("Check-out:", 300, detY + 118);
        
        doc
          .fontSize(11)
          .fillColor(colors.dark)
          .font("Helvetica")
          .text(checkOut, 380, detY + 118);
      } else {
        const fechaIngreso = datos.fecha_ingreso || "No especificado";
        const fechaSalida = datos.fecha_salida || "No especificado";

        // Fecha de ingreso
        doc
          .fontSize(10)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text("Fecha Ingreso:", 55, detY + 98);
        
        doc
          .fontSize(11)
          .fillColor(colors.dark)
          .font("Helvetica")
          .text(fechaIngreso, 165, detY + 98);

        // Fecha de salida
        doc
          .fontSize(10)
          .fillColor(colors.gray)
          .font("Helvetica")
          .text("Fecha Salida:", 300, detY + 98);
        
        doc
          .fontSize(11)
          .fillColor(colors.dark)
          .font("Helvetica")
          .text(fechaSalida, 400, detY + 98);
      }

      // ===== INFORMACIÓN IMPORTANTE =====
      const resumenY = 372;
      
      doc.roundedRect(40, resumenY, doc.page.width - 80, 55, 6)
         .fillAndStroke(colors.warning, colors.warning);

      doc
        .fontSize(11)
        .fillColor(colors.white)
        .font("Helvetica-Bold")
        .text("INFORMACION IMPORTANTE", 0, resumenY + 8, {
          align: "center",
        });

      doc
        .fontSize(8)
        .fillColor(colors.white)
        .font("Helvetica")
        .text(
          "Presente este documento al momento del check-in junto con identificacion oficial",
          50,
          resumenY + 26,
          { width: doc.page.width - 100, align: "center" }
        )
        .text(
          "Conserve este comprobante durante toda su estancia",
          50,
          resumenY + 38,
          { width: doc.page.width - 100, align: "center" }
        );

      // ===== CÓDIGO QR =====
      if (qrPath && fs.existsSync(qrPath)) {
        try {
          const qrSectionY = 437;

          // Caja para el QR con sombra
          doc.rect(42, qrSectionY + 2, doc.page.width - 84, 120)
             .fillOpacity(0.1)
             .fill(colors.gray);
          doc.fillOpacity(1);
          
          doc.roundedRect(40, qrSectionY, doc.page.width - 80, 120, 6)
             .fillAndStroke(colors.light, colors.gray);

          // Encabezado de sección
          doc.rect(40, qrSectionY, doc.page.width - 80, 26)
             .fill(colors.primaryLight);
          
          doc
            .fontSize(11)
            .fillColor(colors.white)
            .font("Helvetica-Bold")
            .text("CODIGO QR DE VERIFICACION", 55, qrSectionY + 7);

          // QR centrado con marco elegante
          const qrSize = 75;
          const pageWidth = doc.page.width;
          const xPosition = (pageWidth - qrSize) / 2;
          const qrY = qrSectionY + 30;

          // Marco blanco para el QR (sin borde para evitar solapamiento)
          doc.roundedRect(xPosition - 5, qrY - 5, qrSize + 10, qrSize + 10, 4)
             .fill(colors.white);

          // QR centrado
          doc.image(qrPath, xPosition, qrY, {
            width: qrSize,
            height: qrSize,
            align: "center",
          });

          // Texto explicativo
          doc
            .fontSize(7)
            .fillColor(colors.gray)
            .font("Helvetica")
            .text(
              "Escanea este codigo para verificar la autenticidad del comprobante",
              50,
              qrY + qrSize + 5,
              { 
                align: "center",
                width: doc.page.width - 100
              }
            );

          console.log("✅ QR incluido en el PDF correctamente");
        } catch (qrError) {
          console.error("❌ Error al incluir QR en PDF:", qrError);
        }
      }

      // ===== PIE DE PÁGINA =====
      const footerY = 565;

      // Línea decorativa
      doc
        .moveTo(40, footerY)
        .lineTo(doc.page.width - 40, footerY)
        .strokeColor(colors.primaryLight)
        .lineWidth(1.5)
        .stroke();

      // Información de contacto en el footer
      doc
        .fontSize(7)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text(
          "Hotel Residency Club  |  Tel: +52 (XXX) XXX-XXXX  |  Email: info@hotelresidencyclub.com",
          0,
          footerY + 8,
          { align: "center" }
        );

      // Fecha y referencia
      doc
        .fontSize(7)
        .fillColor(colors.gray)
        .font("Helvetica")
        .text(
          `Generado: ${new Date().toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' })} • Ref: ${referencia}`,
          0,
          footerY + 20,
          { align: "center" }
        );

      // Mensaje de agradecimiento
      doc
        .fontSize(8)
        .fillColor(colors.primary)
        .font("Helvetica-Bold")
        .text(
          "Gracias por elegirnos!",
          0,
          footerY + 35,
          { align: "center" }
        );

      doc.end();

      doc.on("end", () => {
        console.log("✅ PDF profesional generado exitosamente en:", filePath);
        resolve(filePath);
      });

      doc.on("error", (error) => {
        console.error("❌ Error al generar PDF:", error);
        reject(error);
      });
    } catch (error) {
      console.error("❌ Error en generateAndSendPDF:", error);
      reject(error);
    }
  });
};
