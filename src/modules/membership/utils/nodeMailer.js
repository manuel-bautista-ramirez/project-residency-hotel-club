// utils/nodeMailer.js
import nodemailer from "nodemailer";

/**
 * Convierte un número a letras en español
 * @param {number} numero - Número a convertir
 * @returns {string} Número en letras
 */
const convertirNumeroALetras = (numero) => {
  // Asegurarse de que es un número
  const num = Number(numero);
  if (isNaN(num)) return 'cantidad no válida';
  
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (num === 0) return 'cero';
  if (num === 100) return 'cien';
  
  let resultado = '';
  const parteEntera = Math.floor(num);
  
  if (parteEntera < 10) {
    resultado = unidades[parteEntera];
  } else if (parteEntera < 20) {
    resultado = especiales[parteEntera - 10];
  } else if (parteEntera < 100) {
    const dec = Math.floor(parteEntera / 10);
    const uni = parteEntera % 10;
    resultado = decenas[dec] + (uni > 0 ? ' y ' + unidades[uni] : '');
  } else if (parteEntera < 1000) {
    const cen = Math.floor(parteEntera / 100);
    const resto = parteEntera % 100;
    resultado = centenas[cen] + (resto > 0 ? ' ' + convertirNumeroALetras(resto) : '');
  } else {
    resultado = parteEntera.toString(); // Para números grandes
  }
  
  // Agregar decimales si existen
  const decimales = Math.round((num - parteEntera) * 100);
  if (decimales > 0) {
    return resultado + ' pesos con ' + convertirNumeroALetras(decimales) + ' centavos';
  }
  
  return resultado + ' pesos';
};

/**
 * Envía correo de comprobante de membresía (sin QR)
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.titularNombre
 * @param {string} params.tipoMembresia
 * @param {string} params.fechaInicio - "YYYY-MM-DD"
 * @param {string} params.fechaFin - "YYYY-MM-DD"
 * @param {string} params.metodoPago
 * @param {number|string} params.precioFinal
 * @param {Array<{nombre_completo:string}>} [params.integrantes]
 */
export async function sendReceiptEmail({
  to,
  subject,
  titularNombre,
  tipoMembresia,
  fechaInicio,
  fechaFin,
  metodoPago,
  precioFinal,
  integrantes = [],
}) {
  try {
    if (!to) throw new Error("No recipients defined (to vacío)");

    // Validar y formatear precioFinal
    const precioFinalNumero = Number(precioFinal);
    if (isNaN(precioFinalNumero)) {
      throw new Error("precioFinal no es un número válido");
    }
    const precioFormateado = precioFinalNumero.toFixed(2);
    const precioEnLetras = convertirNumeroALetras(precioFinalNumero);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const integrantesHTML =
      integrantes.length > 0
        ? `
      <h3 style="color: #16a34a; margin-top: 20px;">Integrantes de la membresía:</h3>
      <ul style="margin-left: 20px;">
        ${integrantes
          .map(
            (integrante) =>
              `<li>${integrante.nombre_completo}</li>`
          )
          .join("")}
      </ul>`
        : "";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 28px;">Hotel Club</h1>
            <h2 style="color: #4b5563; margin: 10px 0 0 0; font-size: 18px;">Comprobante de Membresía</h2>
          </div>
          
          <div style="border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #16a34a; margin-top: 0;">Información de la Membresía</h3>
            <p><strong>Titular:</strong> ${titularNombre}</p>
            <p><strong>Tipo de membresía:</strong> ${tipoMembresia}</p>
            <p><strong>Fecha de inicio:</strong> ${fechaInicio}</p>
            <p><strong>Fecha de expiración:</strong> ${fechaFin}</p>
            <p><strong>Método de pago:</strong> ${metodoPago}</p>
            <p><strong>Total pagado:</strong> ${precioFormateado} MXN</p>
            <p><strong>Total en letras:</strong> ${precioEnLetras}</p>
            ${integrantesHTML}
          </div>
          
          <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="margin: 0; color: #15803d; font-size: 14px; text-align: center;">
              <strong>¡Bienvenido a Hotel Club!</strong><br>
              Su membresía ha sido activada exitosamente. Pregunte por su código QR en recepción.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280;">
            <p>Este es un comprobante automático generado por el sistema.</p>
            <p>Para cualquier consulta, contacte con nosotros.</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Hotel Club" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);

    console.log("📧 Comprobante de membresía enviado por correo");
    return { success: true, message: "Correo enviado exitosamente" };
  } catch (error) {
    console.error("Error enviando comprobante por correo:", error);
    throw error;
  }
}

/**
 * Función deprecated mantenida por compatibilidad
 * @deprecated Usar sendReceiptEmail en su lugar
 */
export async function sendEmail({
  to,
  subject,
  titularNombre,
  tipoMembresia,
  fechaInicio,
  fechaFin,
  qrPath,
  integrantes = [],
}) {
  console.warn("⚠️ sendEmail está deprecated, usar sendReceiptEmail en su lugar");
  
  return await sendReceiptEmail({
    to,
    subject,
    titularNombre,
    tipoMembresia,
    fechaInicio,
    fechaFin,
    metodoPago: "No especificado",
    precioFinal: 0,
    integrantes,
  });
}