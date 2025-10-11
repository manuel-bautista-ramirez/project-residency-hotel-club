import { generateAndSendPDF } from './pdfGenerator.js';
import { generarQR } from './qrGenerator.js';
import validadorDirectorios from './validadorDirectorios.js';
import emailService from '../../../services/emailService.js';
import whatsappService from '../../../services/whatsappService.js';
import fs from 'fs';

export class PdfEnvioService {
  constructor() {
    // Validar estructura completa al inicializar
    console.log('🔄 Inicializando servicio de envío de PDF...');
    const resultadoValidacion = validadorDirectorios.validarEstructuraCompleta();

    if (!resultadoValidacion.exitoso) {
      console.error('❌ No se pudo inicializar el servicio - Errores en la estructura de directorios');
      throw new Error('Error en la estructura de directorios: ' + resultadoValidacion.errores.join(', '));
    }

    console.log('✅ Servicio de envío de PDF inicializado correctamente');
  }

  /**
   * Envía comprobante de reservación por los medios seleccionados
   */
  async enviarComprobanteReservacion(datos, pdfPath, opciones = {}) {
    const resultados = {
      email: { success: false, error: null },
      whatsapp: { success: false, error: null }
    };

    try {
      console.log('📤 Iniciando envío de comprobante de reservación...');
      console.log('Datos recibidos en enviarComprobanteReservacion:', datos);
      console.log('PDF Path:', pdfPath);
      console.log('Opciones:', opciones);

      // Envío por Email
      if (opciones.sendEmail && datos.correo) {
        try {
          await this._enviarEmailReservacion(datos, pdfPath);
          resultados.email.success = true;
          console.log('✅ Email de reservación enviado exitosamente');
        } catch (emailError) {
          resultados.email.error = emailError.message;
          console.error('❌ Error enviando email de reservación:', emailError);
        }
      }

      // Envío por WhatsApp
      if (opciones.sendWhatsApp && datos.telefono) {
        try {
          await this._enviarWhatsAppReservacion(datos, pdfPath);
          resultados.whatsapp.success = true;
          console.log('✅ WhatsApp de reservación enviado exitosamente');
        } catch (whatsappError) {
          resultados.whatsapp.error = whatsappError.message;
          console.error('❌ Error enviando WhatsApp de reservación:', whatsappError);
        }
      }

      return resultados;

    } catch (error) {
      console.error('❌ Error general en envío de reservación:', error);
      throw error;
    }
  }

  /**
   * Envía comprobante de renta por los medios seleccionados
   */
  async enviarComprobanteRenta(datos, pdfPath, opciones = {}) {
    const resultados = {
      email: { success: false, error: null },
      whatsapp: { success: false, error: null }
    };

    try {
      console.log('📤 Iniciando envío de comprobante de renta...');
      console.log('Datos recibidos en enviarComprobanteRenta:', datos);
      console.log('PDF Path:', pdfPath);
      console.log('Opciones:', opciones);

      // Envío por Email
      if (opciones.sendEmail && datos.email) {
        try {
          await this._enviarEmailRenta(datos, pdfPath);
          resultados.email.success = true;
          console.log('✅ Email de renta enviado exitosamente');
        } catch (emailError) {
          resultados.email.error = emailError.message;
          console.error('❌ Error enviando email de renta:', emailError);
        }
      }

      // Envío por WhatsApp
      if (opciones.sendWhatsApp && datos.phone) {
        try {
          await this._enviarWhatsAppRenta(datos, pdfPath);
          resultados.whatsapp.success = true;
          console.log('✅ WhatsApp de renta enviado exitosamente');
        } catch (whatsappError) {
          resultados.whatsapp.error = whatsappError.message;
          console.error('❌ Error enviando WhatsApp de renta:', whatsappError);
        }
      }

      return resultados;

    } catch (error) {
      console.error('❌ Error general en envío de renta:', error);
      throw error;
    }
  }

  /**
   * Envía email para reservación
   */
  async _enviarEmailReservacion(datos, pdfPath) {
    const subject = `Comprobante de Reservación - Habitación ${datos.habitacion_id}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏨 Hotel Residency Club</h1>
          <h2>Comprobante de Reservación</h2>
        </div>

        <div class="content">
          <p>Estimado(a) <strong>${datos.nombre_cliente}</strong>,</p>
          <p>Su reservación ha sido creada exitosamente. Aquí están los detalles:</p>

          <div class="details">
            <h3>📋 Detalles de la Reservación</h3>
            <p><strong>Habitación:</strong> ${datos.habitacion_id}</p>
            <p><strong>Fecha de Ingreso:</strong> ${datos.fecha_ingreso}</p>
            <p><strong>Fecha de Salida:</strong> ${datos.fecha_salida}</p>
            <p><strong>Monto Total:</strong> $${datos.monto} MXN</p>
            <p><strong>Estado:</strong> Confirmada ✅</p>
          </div>

          <p>Adjunto encontrará su comprobante oficial en formato PDF.</p>
          <p>Para cualquier duda o modificación, no dude en contactarnos.</p>
        </div>

        <div class="footer">
          <p>🏨 <strong>Hotel Residency Club</strong></p>
          <p>📞 Teléfono: +52 XXX-XXX-XXXX</p>
          <p>📧 Email: info@hotelresidencyclub.com</p>
          <p>¡Gracias por elegirnos! ✨</p>
        </div>
      </body>
      </html>
    `;

    await emailService.send({
      to: datos.correo,
      subject: subject,
      html: html,
      attachments: [{
        filename: `reservacion_${datos.habitacion_id}_${Date.now()}.pdf`,
        path: pdfPath
      }]
    });
  }

  /**
   * Envía email para renta
   */
  async _enviarEmailRenta(datos, pdfPath) {
    const subject = `Comprobante de Renta - Habitación ${datos.habitacion_id}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏨 Hotel Residency Club</h1>
          <h2>Comprobante de Renta</h2>
        </div>

        <div class="content">
          <p>Estimado(a) <strong>${datos.client_name}</strong>,</p>
          <p>Su renta ha sido procesada exitosamente. Aquí están los detalles:</p>

          <div class="details">
            <h3>📋 Detalles de la Renta</h3>
            <p><strong>Habitación:</strong> ${datos.habitacion_id}</p>
            <p><strong>Check-in:</strong> ${datos.check_in}</p>
            <p><strong>Check-out:</strong> ${datos.check_out}</p>
            <p><strong>Monto Total:</strong> $${datos.price} MXN</p>
            <p><strong>Método de Pago:</strong> ${datos.payment_type}</p>
            <p><strong>Estado:</strong> Activa ✅</p>
          </div>

          <p>Adjunto encontrará su comprobante oficial en formato PDF.</p>
          <p>¡Esperamos que disfrute su estancia!</p>
        </div>

        <div class="footer">
          <p>🏨 <strong>Hotel Residency Club</strong></p>
          <p>📞 Teléfono: +52 XXX-XXX-XXXX</p>
          <p>📧 Email: info@hotelresidencyclub.com</p>
          <p>¡Gracias por su preferencia! 🌟</p>
        </div>
      </body>
      </html>
    `;

    await emailService.send({
      to: datos.email,
      subject: subject,
      html: html,
      attachments: [{
        filename: `renta_${datos.habitacion_id}_${Date.now()}.pdf`,
        path: pdfPath
      }]
    });
  }

  /**
   * Envía WhatsApp para reservación
   */
  async _enviarWhatsAppReservacion(datos, pdfPath) {
    const mensaje = `✅ *RESERVACIÓN CONFIRMADA*

🏨 *Hotel Residency Club*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Cliente:* ${datos.nombre_cliente}
🏠 *Habitación:* ${datos.habitacion_id}

📅 *Check-in:* ${datos.fecha_ingreso}
📅 *Check-out:* ${datos.fecha_salida}
💰 *Monto:* $${datos.monto} MXN

📋 *Estado:* Confirmada ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Adjuntamos su comprobante oficial en PDF.

¡Esperamos su llegada! 🎉
🏨 *Hotel Residency Club*`;

    await whatsappService.enviarMensajeConPDF(
      datos.telefono,
      mensaje,
      pdfPath,
      `reservacion_${datos.habitacion_id}.pdf`
    );
  }

  /**
   * Envía WhatsApp para renta
   */
  async _enviarWhatsAppRenta(datos, pdfPath) {
    const mensaje = `✅ *RENTA CONFIRMADA*

🏨 *Hotel Residency Club*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Cliente:* ${datos.client_name}
🏠 *Habitación:* ${datos.habitacion_id}

📅 *Check-in:* ${datos.check_in}
📅 *Check-out:* ${datos.check_out}
💰 *Monto:* $${datos.price} MXN
💳 *Método de pago:* ${datos.payment_type}

📋 *Estado:* Activa ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Adjuntamos su comprobante oficial en PDF.

¡Disfrute su estancia! 🎉
🏨 *Hotel Residency Club*`;

    await whatsappService.enviarMensajeConPDF(
      datos.phone,
      mensaje,
      pdfPath,
      `renta_${datos.habitacion_id}.pdf`
    );
  }

  /**
   * Verifica el estado de los servicios
   */
  obtenerEstadoServicios() {
    return {
      email: emailService.transporter ? 'Conectado' : 'Desconectado',
      whatsapp: whatsappService.isConnected ? 'Conectado' : 'Desconectado'
    };
  }

  /**
   * Método para generar comprobante completo (QR + PDF)
   */
  async generarComprobanteCompleto(datos, tipo, opciones = {}) {
    try {
      console.log('=== GENERANDO COMPROBANTE COMPLETO ===');

      // Validar parámetros de entrada
      if (!datos || !tipo) {
        throw new Error('Datos y tipo son requeridos');
      }

      // Generar QR primero
      console.log('📱 Generando código QR...');
      const qrPath = await generarQR(datos, tipo);

      // Generar PDF con QR incluido
      console.log('📄 Generando PDF con QR...');
      const pdfPath = await generateAndSendPDF(datos, tipo, qrPath);

      return {
        success: true,
        pdfPath,
        qrPath,
        mensaje: 'Comprobante generado exitosamente'
      };
    } catch (error) {
      console.error('❌ Error generando comprobante completo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Crear instancia única
const pdfEnvioService = new PdfEnvioService();

export default pdfEnvioService;
