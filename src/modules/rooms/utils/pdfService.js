// utils/pdfService.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generatePDF } from "../utils/pdfGenerator.js";
import { generateQR } from "../utils/qrGenerator.js";
import emailService from "../../../services/emailService.js";
import whatsappService from "../../../services/whatsappService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Función genérica que genera PDF y QR, guarda en disco y envía por email/WhatsApp.
 * @param {object} data - Datos de la renta o reservación.
 * @param {"rentas"|"reservaciones"} type - Tipo de documento.
 */
export const generateAndSendDocuments = async (data, type) => {
  try {
    // Rutas de archivos
    const pdfDir = path.join(__dirname, `../../../../public/uploads/rooms/pdf/${type}`);
    const qrDir = path.join(__dirname, `../../../../public/uploads/rooms/qr/${type}`);

    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    // Generar PDF
    const pdfPath = path.join(pdfDir, `${type}_${data.id}.pdf`);
    await generatePDF(data, pdfPath);

    // Generar QR
    const qrPath = path.join(qrDir, `${type}_qr_${data.id}.png`);
    const qrContent = `https://tu-dominio.com/${type}/ver/${data.id}`;
    await generateQR(qrContent, qrPath);

    console.log(`✅ Archivos generados:\n- PDF: ${pdfPath}\n- QR:  ${qrPath}`);

    // Enviar por email
    if (data.email) {
      const emailResult = await emailService.send({
        to: data.email,
        subject: `📄 Comprobante de ${type === "rentas" ? "Renta" : "Reservación"} #${data.id}`,
        html: `
          <h2>🏨 ${type === "rentas" ? "Comprobante de Renta" : "Comprobante de Reservación"}</h2>
          <p>Hola <b>${data.client_name || "Cliente"}</b>,</p>
          <p>Adjunto encontrarás tu comprobante en formato PDF junto con su código QR de verificación.</p>
          <p>Gracias por confiar en <b>Hotel Residency Club</b>.</p>
        `,
        attachments: [
          { filename: path.basename(pdfPath), path: pdfPath },
          { filename: path.basename(qrPath), path: qrPath },
        ],
      });
      console.log("📧 Email enviado:", emailResult.success);
    }

    // Enviar por WhatsApp
    if (data.telefono) {
      await whatsappService.waitForReady();
      const mensaje = `🏨 *Hotel Residency Club*\n` +
        `📋 *${type === "rentas" ? "Comprobante de Renta" : "Comprobante de Reservación"}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 Cliente: ${data.client_name}\n` +
        `📅 Fecha: ${new Date().toLocaleDateString("es-MX")}\n` +
        `💰 Total: $${data.total || "—"} MXN\n\n` +
        `🔗 Verifica tu documento escaneando el código QR adjunto.\n\n` +
        `¡Gracias por elegirnos! 🌟`;

      await whatsappService.enviarMensajeConPDF(
        data.telefono,
        mensaje,
        pdfPath,
        `${type}_${data.id}.pdf`
      );
      console.log("📱 Comprobante enviado por WhatsApp a:", data.telefono);
    }

    return { success: true, pdfPath, qrPath };

  } catch (error) {
    console.error("❌ Error en generateAndSendDocuments:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Aliases para compatibilidad con el código existente en roomsController.js
 */
export const generateAndSendRentPDF = (data) => generateAndSendDocuments(data, "rentas");
export const generateAndSendReservationPDF = (data) => generateAndSendDocuments(data, "reservaciones");
