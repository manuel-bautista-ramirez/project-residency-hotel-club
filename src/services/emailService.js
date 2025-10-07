import nodemailer from 'nodemailer';
import { config } from '../config/configuration.js';

class EmailService {
  constructor() {
    // La configuración del transporter debe usar las variables de entorno
    // Asegúrate de que estén definidas en tu archivo .env y cargadas en 'config'
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // True para 465, false para otros puertos
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
    try {
      // Asignar un 'from' por defecto si no se provee
      const options = {
        from: `"Hotel Club" <${config.email.user}>`,
        ...mailOptions,
      };

      await this.transporter.sendMail(options);
      console.log(`📧 Email enviado exitosamente a ${options.to}`);
      return { success: true, message: 'Email enviado exitosamente' };
    } catch (error) {
      console.error(`❌ Error al enviar email a ${mailOptions.to}:`, error);
      // Devolvemos el error para que la cola de trabajos pueda manejarlo
      throw new Error(`Fallo al enviar email: ${error.message}`);
    }
  }
}

const emailService = new EmailService();

export default emailService;
