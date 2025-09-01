import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, qrPath }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Hotel Club" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <h2>¡Bienvenido a tu Membresía!</h2>
        <p>${text}</p>
        <p><strong>Tu QR de acceso:</strong></p>
        <img src="cid:qrimagen" alt="QR" style="width:200px;height:200px;" />
      `,
      attachments: [
        {
          filename: "membresia_qr.png",
          path: qrPath,
          cid: "qrimagen" // 🔑 este ID se usa en el HTML
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Correo enviado con QR ✅");
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
};

