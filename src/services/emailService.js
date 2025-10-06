import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.isEnabled = false; // Por defecto deshabilitado
    this.transporter = null;
  }

  _createTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  /**
   * Envía un correo electrónico de texto plano.
   * Mantiene la firma original para no romper la compatibilidad.
   */
  async sendEmail(to, subject, body) {
    try {
      if (!this.isEnabled) {
        console.log('📧 Email service (Plain Text) deshabilitado - Email no enviado');
        console.log(`Para: ${to}`);
        console.log(`Asunto: ${subject}`);
        console.log(`Cuerpo: ${body}`);
        return { success: false, message: 'Email service deshabilitado' };
      }

      this._createTransporter();
      const mailOptions = {
        from: `"Hotel Club" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: body, // Se envía como texto plano
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email de texto plano enviado exitosamente a: ${to}`);
      return { success: true, message: 'Email enviado exitosamente' };
    } catch (error) {
      console.error('❌ Error enviando email de texto plano:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Nuevo método para enviar correos en formato HTML.
   */
  async sendHtmlEmail(to, subject, html) {
    try {
      if (!this.isEnabled) {
        console.log('📧 Email service (HTML) deshabilitado - Email no enviado');
        console.log(`Para: ${to}`);
        console.log(`Asunto: ${subject}`);
        console.log(`Cuerpo HTML: ${html}`);
        return { success: false, message: 'Email service deshabilitado' };
      }

      this._createTransporter();
      const mailOptions = {
        from: `"Hotel Club" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: html, // Se envía como HTML
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email HTML enviado exitosamente a: ${to}`);
      return { success: true, message: 'Email enviado exitosamente' };
    } catch (error) {
      console.error('❌ Error enviando email HTML:', error);
      return { success: false, error: error.message };
    }
  }

  async sendReservationConfirmation(email, reservationData) {
    const subject = `Confirmación de Reservación #${reservationData.numero}`;
    const body = `
      Estimado/a ${reservationData.clienteNombre},
      Su reservación ha sido confirmada:
      - Número: ${reservationData.numero}
      - Fecha entrada: ${reservationData.fechaEntrada}
      - Fecha salida: ${reservationData.fechaSalida}
      - Total: $${reservationData.total}
      Gracias por elegirnos.
    `;
    // Llama al método original de texto plano.
    return await this.sendEmail(email, subject, body);
  }

  async sendCheckInReminder(email, reservationData) {
    const subject = `Recordatorio de Check-in - Reservación #${reservationData.numero}`;
    const body = `
      Estimado/a ${reservationData.clienteNombre},
      Le recordamos su reservación para mañana:
      - Número: ${reservationData.numero}
      - Fecha entrada: ${reservationData.fechaEntrada}
      - Habitación: ${reservationData.habitacion}
      Esperamos su llegada.
    `;
    // Llama al método original de texto plano.
    return await this.sendEmail(email, subject, body);
  }

  enable() {
    this.isEnabled = true;
    console.log('📧 Email service habilitado');
  }

  disable() {
    this.isEnabled = false;
    console.log('📧 Email service deshabilitado');
  }
}

const emailService = new EmailService();

export const sendReportEmail = async (to, reportData) => {
  const subject = `Reporte ${reportData.tipo} - ${new Date().toLocaleDateString()}`;
  const body = `
    Reporte generado:
    - Tipo: ${reportData.tipo}
    - Período: ${reportData.periodo?.inicio || 'N/A'} - ${reportData.periodo?.fin || 'N/A'}
    - Total registros: ${reportData.resumen?.total_registros || 0}
    - Total ingresos: $${reportData.resumen?.total_ingresos || 0}
  `;
  // Llama al método original de texto plano.
  return await emailService.sendEmail(to, subject, body);
};

export const sendRentReceiptEmail = async (to, rentData) => {
  return await emailService.sendReservationConfirmation(to, rentData);
};

export const sendReservationReceiptEmail = async (to, reservationData) => {
  return await emailService.sendReservationConfirmation(to, reservationData);
};

export default emailService;