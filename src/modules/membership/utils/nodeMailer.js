// utils/nodeMailer.js
import nodemailer from "nodemailer";

/**
 * Envía correo con QR embebido y, si aplica, lista de integrantes
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.titularNombre
 * @param {string} params.tipoMembresia
 * @param {string} params.fechaInicio - "YYYY-MM-DD"
 * @param {string} params.fechaFin - "YYYY-MM-DD"
 * @param {string} params.qrPath - ruta absoluta del PNG
 * @param {Array<{nombre_completo:string, relacion?:string}>} [params.integrantes]
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
  try {
    if (!to) throw new Error("No recipients defined (to vacío)");

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
      <h3>Integrantes:</h3>
      <ul>
        ${integrantes
          .map(
            (i) =>
              `<li>${i.nombre_completo}${
                i.relacion ? ` <em>(${i.relacion})</em>` : ""
              }</li>`
          )
          .join("")}
      </ul>`
        : "";

    const html = `
      <h2>¡Bienvenido a tu Membresía!</h2>
      <p><strong>Titular:</strong> ${titularNombre}</p>
      <p><strong>Tipo:</strong> ${tipoMembresia}</p>
      <p><strong>Inicio:</strong> ${fechaInicio}</p>
      <p><strong>Expira:</strong> ${fechaFin}</p>
      ${integrantesHTML}
      <p><strong>Tu QR de acceso:</strong></p>
      <img src="cid:qrimagen" alt="QR" style="width:220px;height:220px;" />
    `;

    await transporter.sendMail({
      from: `"Hotel Club" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: "membresia_qr.png",
          path: qrPath, // 🔒 archivo en disco
          cid: "qrimagen", // se referencia en <img src="cid:qrimagen" />
        },
      ],
    });

    console.log("📧 Correo enviado con QR");
  } catch (error) {
    console.error("Error enviando correo:", error);
    throw error;
  }
}


