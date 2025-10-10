// utils/pdfService.js
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { generateQR } from "./qrGenerator.js"; // Import correcto

export const generatePDF = async (reservationData) => {
  try {
    const { id, nombre, habitacion, fechaEntrada, fechaSalida, total } = reservationData;

    const qrDir = path.join(process.cwd(), "public", "uploads", "rooms", "qr", "reservaciones");
    const pdfDir = path.join(process.cwd(), "public", "uploads", "rooms", "pdf", "reservaciones");

    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const qrText = `Reserva #${id} - ${nombre} - Habitación: ${habitacion}`;
    const qrFilename = `reservacion_${id}.png`;
    const qrPath = path.join(qrDir, qrFilename);

    // Genera QR usando la función importada
    await generateQR(qrText, path.join("uploads", "rooms", "qr", "reservaciones", qrFilename));

    const pdfPath = path.join(pdfDir, `reservacion_${id}.pdf`);
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    doc.fontSize(20).text("Comprobante de Reservación", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Nombre: ${nombre}`);
    doc.text(`Habitación: ${habitacion}`);
    doc.text(`Fecha de entrada: ${fechaEntrada}`);
    doc.text(`Fecha de salida: ${fechaSalida}`);
    doc.text(`Total: $${total}`);
    doc.moveDown();
    doc.text("Código QR:", { underline: true });
    doc.image(qrPath, { fit: [120, 120], align: "center" });

    doc.end();
    await new Promise((resolve) => writeStream.on("finish", resolve));

    console.log(`✅ PDF generado en: ${pdfPath}`);
    console.log(`✅ QR generado en: ${qrPath}`);

    return { pdfPath, qrPath };
  } catch (error) {
    console.error("❌ Error generando PDF/QR:", error);
    throw error;
  }
};
