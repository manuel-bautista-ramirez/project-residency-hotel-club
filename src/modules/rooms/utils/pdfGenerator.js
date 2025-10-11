import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import validadorDirectorios from './validadorDirectorios.js';

export const generateAndSendPDF = async (datos, tipo, qrPath = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Validar tipo de documento
      const normalizedTipo = tipo.toLowerCase();
      if (!['renta', 'reservacion', 'reservation'].includes(normalizedTipo)) {
        throw new Error(`Tipo de documento no válido: ${tipo}`);
      }

      // Determinar folder tipo
      const folderTipo = normalizedTipo === 'reservation' ? 'reservaciones' : normalizedTipo + 's';

      // Validar y obtener ruta organizada usando el validador
      const rutaBase = validadorDirectorios.obtenerRuta('pdf', folderTipo);
      const fileName = `comprobante_${folderTipo}_${Date.now()}.pdf`;
      const filePath = path.join(rutaBase, fileName);

      console.log('=== GENERANDO PDF PROFESIONAL ===');
      console.log('Tipo:', tipo);
      console.log('Tipo normalizado:', folderTipo);
      console.log('Ruta destino:', filePath);

      // Validar que el directorio existe usando el validador
      if (!validadorDirectorios.validarRutaEspecifica('pdf', folderTipo)) {
        throw new Error(`No se pudo validar/crear el directorio para PDF: ${rutaBase}`);
      }

      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      doc.pipe(fs.createWriteStream(filePath));

      // Colores corporativos
      const colors = {
        primary: '#2c5aa0',
        secondary: '#34495e',
        success: '#27ae60',
        warning: '#f39c12',
        danger: '#e74c3c',
        light: '#ecf0f1',
        dark: '#2c3e50',
        gray: '#95a5a6'
      };

      // ===== ENCABEZADO PROFESIONAL =====
      // Fondo del encabezado
      doc.rect(0, 0, doc.page.width, 120)
         .fill(colors.primary);

      // Logo o icono del hotel
      doc.fontSize(24)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('🏨', 50, 30, { align: 'left' });

      // Nombre del hotel
      doc.fontSize(18)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('HOTEL RESIDENCY CLUB', 80, 35, { align: 'left' });

      // Tipo de comprobante
      doc.fontSize(16)
         .fillColor('#ffffff')
         .font('Helvetica')
         .text(`COMPROBANTE DE ${folderTipo.toUpperCase()}`, 0, 70, { align: 'center' });

      // Número de referencia
      const referencia = `REF-${Date.now()}`;
      doc.fontSize(10)
         .fillColor('rgba(255,255,255,0.8)')
         .font('Helvetica-Oblique')
         .text(`Referencia: ${referencia}`, 0, 95, { align: 'center' });

      doc.moveDown(3);

      // ===== ESTADO DE LA TRANSACCIÓN =====
      const estadoY = 140;
      doc.rect(50, estadoY, doc.page.width - 100, 30)
         .fill(colors.success);

      doc.fontSize(14)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('✅ TRANSACCIÓN EXITOSA', 0, estadoY + 8, { align: 'center' });

      doc.moveDown(2.5);

      // ===== INFORMACIÓN DEL CLIENTE =====
      const infoClienteY = doc.y;
      doc.rect(50, infoClienteY, doc.page.width - 100, 80)
         .fill(colors.light)
         .stroke(colors.gray);

      doc.fontSize(16)
         .fillColor(colors.dark)
         .font('Helvetica-Bold')
         .text('👤 INFORMACIÓN DEL CLIENTE', 60, infoClienteY + 15);

      const nombre = datos.nombre || datos.client_name || datos.nombre_cliente || 'No especificado';
      const email = datos.email || datos.correo || 'No especificado';
      const telefono = datos.phone || datos.telefono || 'No especificado';

      doc.fontSize(11)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(`Nombre: ${nombre}`, 60, infoClienteY + 40)
         .text(`Email: ${email}`, 60, infoClienteY + 55)
         .text(`Teléfono: ${telefono}`, 60, infoClienteY + 70);

      doc.moveDown(5);

      // ===== DETALLES DE LA TRANSACCIÓN =====
      const detallesY = doc.y;
      doc.rect(50, detallesY, doc.page.width - 100, 120)
         .fill(colors.light)
         .stroke(colors.gray);

      doc.fontSize(16)
         .fillColor(colors.dark)
         .font('Helvetica-Bold')
         .text('📋 DETALLES DE LA TRANSACCIÓN', 60, detallesY + 15);

      const monto = datos.monto || datos.amount || datos.price || 0;
      const habitacion = datos.habitacion_id || 'No especificada';
      const fechaEmision = new Date().toLocaleDateString('es-MX');
      const horaEmision = new Date().toLocaleTimeString('es-MX');

      // Columna izquierda
      doc.fontSize(11)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(`Monto:`, 60, detallesY + 40)
         .text(`Habitación:`, 60, detallesY + 55)
         .text(`Fecha de Emisión:`, 60, detallesY + 70)
         .text(`Hora de Emisión:`, 60, detallesY + 85);

      // Columna derecha (valores)
      doc.fontSize(11)
         .fillColor(colors.dark)
         .font('Helvetica-Bold')
         .text(`$${monto.toLocaleString()} MXN`, 200, detallesY + 40)
         .text(habitacion, 200, detallesY + 55)
         .text(fechaEmision, 200, detallesY + 70)
         .text(horaEmision, 200, detallesY + 85);

      // Datos específicos según el tipo
      if (normalizedTipo === 'renta') {
        const tipoPago = datos.payment_type || datos.tipo_pago || 'No especificado';
        const checkIn = datos.check_in || datos.fecha_ingreso || 'No especificado';
        const checkOut = datos.check_out || datos.fecha_salida || 'No especificado';

        doc.fontSize(11)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text(`Tipo de Pago:`, 60, detallesY + 100)
           .text(`Check-in:`, 60, detallesY + 115)
           .text(`Check-out:`, 60, detallesY + 130);

        doc.fontSize(11)
           .fillColor(colors.dark)
           .font('Helvetica-Bold')
           .text(tipoPago, 200, detallesY + 100)
           .text(checkIn, 200, detallesY + 115)
           .text(checkOut, 200, detallesY + 130);

      } else {
        const fechaIngreso = datos.fecha_ingreso || 'No especificado';
        const fechaSalida = datos.fecha_salida || 'No especificado';

        doc.fontSize(11)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text(`Fecha Ingreso:`, 60, detallesY + 100)
           .text(`Fecha Salida:`, 60, detallesY + 115);

        doc.fontSize(11)
           .fillColor(colors.dark)
           .font('Helvetica-Bold')
           .text(fechaIngreso, 200, detallesY + 100)
           .text(fechaSalida, 200, detallesY + 115);
      }

      doc.moveDown(8);

      // ===== RESUMEN IMPORTANTE =====
      const resumenY = doc.y;
      doc.rect(50, resumenY, doc.page.width - 100, 60)
         .fill(colors.warning)
         .stroke(colors.warning);

      doc.fontSize(14)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('💡 INFORMACIÓN IMPORTANTE', 0, resumenY + 10, { align: 'center' });

      doc.fontSize(9)
         .fillColor('#ffffff')
         .font('Helvetica')
         .text('• Presente este documento al momento del check-in', 0, resumenY + 30, { align: 'center' })
         .text('• Conserve este comprobante durante toda su estancia', 0, resumenY + 43, { align: 'center' });

      doc.moveDown(4);

      // ===== CÓDIGO QR MEJORADO =====
      if (qrPath && fs.existsSync(qrPath)) {
        try {
          const qrSectionY = doc.y;

          // Encabezado del QR
          doc.fontSize(16)
             .fillColor(colors.dark)
             .font('Helvetica-Bold')
             .text('🔐 CÓDIGO QR DE VERIFICACIÓN', 0, qrSectionY, { align: "center" });

          doc.moveDown(1);

          // Marco para el QR
          const qrSize = 120;
          const pageWidth = doc.page.width;
          const xPosition = (pageWidth - qrSize) / 2;
          const qrY = doc.y;

          // Fondo del QR
          doc.rect(xPosition - 10, qrY - 10, qrSize + 20, qrSize + 20)
             .fill(colors.light)
             .stroke(colors.gray);

          // QR centrado
          doc.image(qrPath, xPosition, qrY, {
            width: qrSize,
            height: qrSize,
            align: 'center'
          });

          doc.moveDown();
          doc.y += qrSize + 10;

          // Texto explicativo del QR
          doc.fontSize(9)
             .fillColor(colors.gray)
             .font('Helvetica-Oblique')
             .text('Escanea este código QR para verificar la autenticidad de tu comprobante', { align: "center" })
             .text('y acceder a información adicional de tu reserva.', { align: "center" });

          console.log('✅ QR incluido en el PDF correctamente');

        } catch (qrError) {
          console.error('❌ Error al incluir QR en PDF:', qrError);
          doc.fontSize(10)
             .fillColor(colors.danger)
             .text('❌ Error al generar código QR', { align: "center" });
        }
      } else {
        console.log('⚠️ No se pudo incluir QR en el PDF - Archivo no encontrado:', qrPath);
        doc.fontSize(10)
           .fillColor(colors.danger)
           .text('⚠️ Código QR no disponible temporalmente', { align: "center" });
      }

      // ===== PIE DE PÁGINA ACTUAL =====
      const footerY = doc.page.height - 50;

      doc.moveTo(50, footerY)
         .lineTo(doc.page.width - 50, footerY)
         .strokeColor(colors.gray)
         .lineWidth(0.5)
         .stroke();

      doc.fontSize(8)
         .fillColor(colors.gray)
         .font('Helvetica')
         .text(`Comprobante generado el: ${new Date().toLocaleString('es-MX')}`, 50, footerY + 10)
         .text(`Página 1 de 2`, 0, footerY + 10, { align: 'right' });

      // ===== SEGUNDA PÁGINA - TÉRMINOS Y CONDICIONES =====
      doc.addPage();

      // Encabezado de la segunda página
      doc.rect(0, 0, doc.page.width, 80)
         .fill(colors.secondary);

      doc.fontSize(18)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('📄 TÉRMINOS Y CONDICIONES', 0, 30, { align: 'center' });

      doc.fontSize(12)
         .fillColor('rgba(255,255,255,0.8)')
         .font('Helvetica')
         .text('Por favor, lea atentamente la siguiente información', 0, 55, { align: 'center' });

      doc.moveDown(4);

      // Contenido de términos y condiciones
      const terminos = [
        {
          titulo: "📋 Validación del Comprobante",
          contenido: "Este documento es su comprobante oficial. Deberá presentarlo al momento del check-in junto con una identificación oficial."
        },
        {
          titulo: "⏰ Política de Check-in/Check-out",
          contenido: "Check-in: 3:00 PM | Check-out: 12:00 PM. Horarios sujetos a disponibilidad."
        },
        {
          titulo: "💰 Política de Pagos",
          contenido: "Todos los cargos deben estar liquidados al momento del check-out. Aceptamos tarjetas de crédito/débito y efectivo."
        },
        {
          titulo: "🚭 Políticas del Hotel",
          contenido: "Es un hotel libre de humo. Se aplicarán cargos por limpieza en caso de incumplimiento."
        },
        {
          titulo: "❌ Política de Cancelación",
          contenido: "Cancelaciones con 48 horas de anticipación para reembolso completo. Cancelaciones tardías están sujetas a cargos."
        },
        {
          titulo: "🔒 Seguridad y Responsabilidad",
          contenido: "El hotel no se hace responsable por objetos de valor dejados en la habitación. Use la caja de seguridad disponible."
        }
      ];

      let terminosY = doc.y;
      terminos.forEach((termino, index) => {
        if (terminosY > doc.page.height - 100) {
          doc.addPage();
          terminosY = 50;
        }

        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text(termino.titulo, 50, terminosY);

        doc.fontSize(9)
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(termino.contenido, 50, terminosY + 15, {
             width: doc.page.width - 100,
             lineGap: 3
           });

        terminosY += 45;
      });

      // ===== INFORMACIÓN DE CONTACTO =====
      doc.moveDown(2);

      const contactoY = doc.y;
      doc.rect(50, contactoY, doc.page.width - 100, 60)
         .fill(colors.light)
         .stroke(colors.gray);

      doc.fontSize(14)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('🏨 Hotel Residency Club', 0, contactoY + 15, { align: 'center' });

      doc.fontSize(9)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text('📞 Teléfono: +52 (XXX) XXX-XXXX | 📧 Email: info@hotelresidencyclub.com', 0, contactoY + 35, { align: 'center' })
         .text('📍 Dirección: [Dirección del hotel] | 🌐 Sitio web: www.hotelresidencyclub.com', 0, contactoY + 48, { align: 'center' });

      // ===== PIE DE PÁGINA SEGUNDA PÁGINA =====
      const footerY2 = doc.page.height - 50;

      doc.moveTo(50, footerY2)
         .lineTo(doc.page.width - 50, footerY2)
         .strokeColor(colors.gray)
         .lineWidth(0.5)
         .stroke();

      doc.fontSize(8)
         .fillColor(colors.gray)
         .font('Helvetica')
         .text(`Referencia: ${referencia}`, 50, footerY2 + 10)
         .text(`Página 2 de 2`, 0, footerY2 + 10, { align: 'right' });

      doc.end();

      doc.on('end', () => {
        console.log('✅ PDF profesional generado exitosamente en:', filePath);
        resolve(filePath);
      });

      doc.on('error', (error) => {
        console.error('❌ Error al generar PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ Error en generateAndSendPDF:', error);
      reject(error);
    }
  });
};
