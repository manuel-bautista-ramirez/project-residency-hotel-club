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
          const whatsappResult = await this._enviarWhatsAppReservacion(datos, pdfPath);
          if (whatsappResult && whatsappResult.success) {
            resultados.whatsapp.success = true;
            console.log('✅ WhatsApp de reservación enviado exitosamente');
          } else {
            resultados.whatsapp.error = whatsappResult?.error || 'Error desconocido';
            console.error('❌ Error enviando WhatsApp de reservación:', whatsappResult?.error);
          }
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
          const whatsappResult = await this._enviarWhatsAppRenta(datos, pdfPath);
          if (whatsappResult && whatsappResult.success) {
            resultados.whatsapp.success = true;
            console.log('✅ WhatsApp de renta enviado exitosamente');
          } else {
            resultados.whatsapp.error = whatsappResult?.error || 'Error desconocido';
            console.error('❌ Error enviando WhatsApp de renta:', whatsappResult?.error);
          }
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
    const habitacion = datos.numero_habitacion || datos.habitacion_id;
    const subject = `✅ Reservación Confirmada - Habitación ${habitacion} | Hotel Residency Club`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a4d8f 0%, #2c5aa0 100%); color: white; padding: 30px 20px; text-align: center; border-top: 5px solid #f1c40f; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .badge { background: #27ae60; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; margin-top: 15px; font-weight: bold; }
          .content { padding: 30px 25px; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          .details-box { background: #f8f9fa; border-left: 4px solid #2c5aa0; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .details-box h3 { color: #1a4d8f; margin-bottom: 15px; font-size: 18px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #666; font-size: 14px; }
          .detail-value { color: #333; font-weight: 600; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #f39c12; margin: 20px 0; }
          .highlight strong { color: #f39c12; }
          .info-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .info-box ul { list-style: none; padding-left: 0; }
          .info-box li { padding: 5px 0; color: #1976d2; }
          .info-box li:before { content: "✓ "; font-weight: bold; }
          .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 13px; }
          .cta-button { background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏨 Hotel Residency Club</h1>
            <p>Tu hogar lejos de casa</p>
            <div class="badge">✅ RESERVACIÓN CONFIRMADA</div>
          </div>

          <div class="content">
            <p class="greeting">Estimado(a) <strong>${datos.nombre_cliente}</strong>,</p>
            <p>¡Excelentes noticias! Su reservación ha sido procesada exitosamente.</p>

            <div class="details-box">
              <h3>📋 Detalles de su Reservación</h3>
              <div class="detail-row">
                <span class="detail-label">🏠 Habitación:</span>
                <span class="detail-value">${habitacion}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Check-in:</span>
                <span class="detail-value">${datos.fecha_ingreso}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Check-out:</span>
                <span class="detail-value">${datos.fecha_salida}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💰 Monto Total:</span>
                <span class="detail-value">$${Number(datos.monto).toLocaleString('es-MX')} MXN</span>
              </div>
            </div>

            <div class="highlight">
              <strong>📄 Comprobante Adjunto:</strong> Encontrará su comprobante oficial en formato PDF adjunto a este correo.
            </div>

            <div class="info-box">
              <strong>💡 Información Importante:</strong>
              <ul>
                <li>Presente este comprobante al momento del check-in</li>
                <li>Traiga identificación oficial vigente</li>
                <li>Horario de check-in: 3:00 PM</li>
                <li>Horario de check-out: 12:00 PM</li>
              </ul>
            </div>

            <p>¿Tiene alguna pregunta o necesita hacer cambios? No dude en contactarnos.</p>
          </div>

          <div class="footer">
            <p><strong>🏨 Hotel Residency Club</strong></p>
            <p>📞 Teléfono: +52 (XXX) XXX-XXXX</p>
            <p>📧 Email: info@hotelresidencyclub.com</p>
            <p style="margin-top: 15px; opacity: 0.8;">¡Esperamos darle la bienvenida pronto! ✨</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.send({
      to: datos.correo,
      subject: subject,
      html: html,
      attachments: [{
        filename: `Reservacion_Hab${habitacion}_${datos.nombre_cliente.replace(/\s+/g, '_')}.pdf`,
        path: pdfPath
      }]
    });
  }

  /**
   * Envía email para renta
   */
  async _enviarEmailRenta(datos, pdfPath) {
    const habitacion = datos.numero_habitacion || datos.habitacion_id;
    const subject = `✅ Renta Confirmada - Habitación ${habitacion} | Hotel Residency Club`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px 20px; text-align: center; border-top: 5px solid #f1c40f; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .badge { background: #1a4d8f; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; margin-top: 15px; font-weight: bold; }
          .content { padding: 30px 25px; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          .details-box { background: #f8f9fa; border-left: 4px solid #27ae60; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .details-box h3 { color: #27ae60; margin-bottom: 15px; font-size: 18px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #666; font-size: 14px; }
          .detail-value { color: #333; font-weight: 600; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #f39c12; margin: 20px 0; }
          .highlight strong { color: #f39c12; }
          .info-box { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .info-box ul { list-style: none; padding-left: 0; }
          .info-box li { padding: 5px 0; color: #2e7d32; }
          .info-box li:before { content: "✓ "; font-weight: bold; }
          .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏨 Hotel Residency Club</h1>
            <p>Tu hogar lejos de casa</p>
            <div class="badge">✅ RENTA CONFIRMADA</div>
          </div>

          <div class="content">
            <p class="greeting">Estimado(a) <strong>${datos.client_name}</strong>,</p>
            <p>¡Bienvenido! Su renta ha sido procesada exitosamente.</p>

            <div class="details-box">
              <h3>📋 Detalles de su Renta</h3>
              <div class="detail-row">
                <span class="detail-label">🏠 Habitación:</span>
                <span class="detail-value">${habitacion}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Check-in:</span>
                <span class="detail-value">${datos.check_in}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Check-out:</span>
                <span class="detail-value">${datos.check_out}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💰 Monto Total:</span>
                <span class="detail-value">$${Number(datos.price).toLocaleString('es-MX')} MXN</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💳 Método de Pago:</span>
                <span class="detail-value">${datos.payment_type}</span>
              </div>
            </div>

            <div class="highlight">
              <strong>📄 Comprobante Adjunto:</strong> Encontrará su comprobante oficial en formato PDF adjunto a este correo.
            </div>

            <div class="info-box">
              <strong>💡 Durante su Estancia:</strong>
              <ul>
                <li>Conserve este comprobante durante toda su estadía</li>
                <li>Horario de check-out: 12:00 PM</li>
                <li>Cualquier cargo adicional se liquidará al momento de salida</li>
                <li>Estamos disponibles 24/7 para atenderle</li>
              </ul>
            </div>

            <p>¿Necesita algo durante su estancia? No dude en contactarnos.</p>
          </div>

          <div class="footer">
            <p><strong>🏨 Hotel Residency Club</strong></p>
            <p>📞 Teléfono: +52 (XXX) XXX-XXXX</p>
            <p>📧 Email: info@hotelresidencyclub.com</p>
            <p style="margin-top: 15px; opacity: 0.8;">¡Disfrute su estadía! ✨</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.send({
      to: datos.email,
      subject: subject,
      html: html,
      attachments: [{
        filename: `Renta_Hab${habitacion}_${datos.client_name.replace(/\s+/g, '_')}.pdf`,
        path: pdfPath
      }]
    });
  }

  /**
   * Envía WhatsApp para reservación
   */
  async _enviarWhatsAppReservacion(datos, pdfPath) {
    const habitacion = datos.numero_habitacion || datos.habitacion_id;
    const mensaje = `✅ *RESERVACIÓN CONFIRMADA*

🏨 *Hotel Residency Club*
_Tu hogar lejos de casa_

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estimado(a) *${datos.nombre_cliente}*

Su reservación ha sido procesada exitosamente.

📋 *DETALLES DE SU RESERVACIÓN*

📌 *Folio:* #${datos.id || 'S/N'}
🏠 *Habitación:* ${habitacion}
📅 *Check-in:* ${datos.fecha_ingreso || datos.check_in}
📅 *Check-out:* ${datos.fecha_salida || datos.check_out}
💰 *Monto Total:* $${Number(datos.monto || datos.price).toLocaleString('es-MX')} MXN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 *Adjunto encontrará su comprobante oficial en PDF*

💡 *Importante:*
• Presente este comprobante al check-in
• Traiga identificación oficial
• Horario de check-in: 3:00 PM

¿Tiene alguna pregunta? Estamos aquí para ayudarle.

¡Esperamos darle la bienvenida pronto! ✨

🏨 *Hotel Residency Club*
📞 +52 (XXX) XXX-XXXX
📧 info@hotelresidencyclub.com`;

    return await whatsappService.enviarMensajeConPDF(
      datos.telefono,
      mensaje,
      pdfPath,
      `Reservacion_Hab${habitacion}_${datos.nombre_cliente.replace(/\s+/g, '_')}.pdf`
    );
  }

  /**
   * Envía WhatsApp para renta
   */
  async _enviarWhatsAppRenta(datos, pdfPath) {
    const habitacion = datos.numero_habitacion || datos.habitacion_id;
    const mensaje = `✅ *RENTA CONFIRMADA*

🏨 *Hotel Residency Club*
_Tu hogar lejos de casa_

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estimado(a) *${datos.client_name}*

Su renta ha sido procesada exitosamente.

📋 *DETALLES DE SU RENTA*

📌 *Folio:* #${datos.id || 'S/N'}
🏠 *Habitación:* ${habitacion}
📅 *Check-in:* ${datos.check_in}
📅 *Check-out:* ${datos.check_out}
💰 *Monto Total:* $${Number(datos.price).toLocaleString('es-MX')} MXN
💳 *Método de Pago:* ${datos.payment_type}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 *Adjunto encontrará su comprobante oficial en PDF*

💡 *Importante:*
• Conserve este comprobante durante su estancia
• Horario de check-out: 12:00 PM
• Cualquier cargo adicional se liquidará al salir

¿Necesita algo durante su estancia? Estamos para servirle.

¡Disfrute su estadía! ✨

🏨 *Hotel Residency Club*
📞 +52 (XXX) XXX-XXXX
📧 info@hotelresidencyclub.com`;

    return await whatsappService.enviarMensajeConPDF(
      datos.phone,
      mensaje,
      pdfPath,
      `Renta_Hab${habitacion}_${datos.client_name.replace(/\s+/g, '_')}.pdf`
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
