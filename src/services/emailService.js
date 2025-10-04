

class EmailService {
  constructor() {
    this.isEnabled = false; // Por defecto deshabilitado
  }

  async sendEmail(to, subject, body) {
    try {
      if (!this.isEnabled) {
        console.log('📧 Email service deshabilitado - Email no enviado');
        console.log(`Para: ${to}`);
        console.log(`Asunto: ${subject}`);
        console.log(`Cuerpo: ${body}`);
        return { success: false, message: 'Email service deshabilitado' };
      }

      // Aquí iría la lógica real de envío de email
      // Por ejemplo: nodemailer, sendgrid, etc.

      console.log('📧 Enviando email...');
      console.log(`Para: ${to}`);
      console.log(`Asunto: ${subject}`);

      return { success: true, message: 'Email enviado exitosamente' };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
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

    return await this.sendEmail(email, subject, body);
  }

  // Método para habilitar el servicio de email
  enable() {
    this.isEnabled = true;
    console.log('📧 Email service habilitado');
  }

  // Método para deshabilitar el servicio de email
  disable() {
    this.isEnabled = false;
    console.log('📧 Email service deshabilitado');
  }
}

// Crear instancia única
const emailService = new EmailService();

// Funciones específicas para reportes
export const sendReportEmail = async (to, reportData) => {
  const subject = `Reporte ${reportData.tipo} - ${new Date().toLocaleDateString()}`;
  const body = `
    Reporte generado:
    - Tipo: ${reportData.tipo}
    - Período: ${reportData.periodo?.inicio || 'N/A'} - ${reportData.periodo?.fin || 'N/A'}
    - Total registros: ${reportData.resumen?.total_registros || 0}
    - Total ingresos: $${reportData.resumen?.total_ingresos || 0}
  `;

  return await emailService.sendEmail(to, subject, body);
};

// Funciones específicas para rentas
export const sendRentReceiptEmail = async (to, rentData) => {
  return await emailService.sendReservationConfirmation(to, rentData);
};

// Funciones específicas para reservaciones
export const sendReservationReceiptEmail = async (to, reservationData) => {
  return await emailService.sendReservationConfirmation(to, reservationData);
};

export default emailService;
