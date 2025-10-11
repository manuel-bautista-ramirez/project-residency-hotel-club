import nodemailer from 'nodemailer';
import { config } from '../config/configuration.js';

class EmailService {
  constructor() {
    // Asegurarse de que las credenciales existen antes de crear el transporter
    if (!config.email.host || !config.email.user || !config.email.pass) {
      console.warn('⚠️  Advertencia: Faltan credenciales de correo en .env. El servicio de email estará deshabilitado.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: Number(config.email.port) || 465,
      secure: (Number(config.email.port) || 465) === 465, // True para 465, false para otros puertos
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    console.log('📧 Email service inicializado.');
    this.verifyConnection();
  }

  /**
   * Verifica la conexión con el servidor SMTP.
   */
  async verifyConnection() {
    if (!this.transporter) {
      return; // No verificar si no hay transporter
    }
    try {
      await this.transporter.verify();
      console.log('✅ Conexión con el servidor de email establecida correctamente.');
    } catch (error) {
      console.error('❌ Error al conectar con el servidor de email:', error.message);
      console.log('   Por favor, verifica las credenciales en tu archivo .env (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS).');
    }
  }

  /**
   * Envía un correo electrónico.
   * @param {object} mailOptions - Opciones para nodemailer (from, to, subject, html, attachments).
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async send(mailOptions) {
    if (!this.transporter) {
      console.error('❌ No se puede enviar el correo, el servicio de email no está configurado.');
      throw new Error('El servicio de email no está configurado.');
    }

    try {
      const options = {
        from: `"Hotel Club" <${config.email.user}>`,
        ...mailOptions,
      };

      await this.transporter.sendMail(options);
      console.log(`📧 Email enviado exitosamente a ${options.to}`);
      return { success: true, message: 'Email enviado exitosamente' };
    } catch (error) {
      console.error(`❌ Error al enviar email a ${mailOptions.to}:`, error);
      throw new Error(`Fallo al enviar email: ${error.message}`);
    }
  }

  /**
   * Envía un correo electrónico con un archivo adjunto.
   * @param {string} to - El destinatario del correo.
   * @param {string} subject - El asunto del correo.
   * @param {string} body - El cuerpo del correo en texto plano.
   * @param {object} attachment - El archivo adjunto.
   * @param {string} attachment.filename - El nombre del archivo.
   * @param {Buffer|string} attachment.content - El contenido del archivo (Buffer o ruta).
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async sendEmailWithAttachment(to, subject, body, attachment) {
    const mailOptions = {
      to,
      subject,
      text: body,
      attachments: [
        attachment
      ],
    };

    return this.send(mailOptions);
  }
}

const emailService = new EmailService();

export default emailService;