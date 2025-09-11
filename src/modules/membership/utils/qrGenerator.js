// utils/qrGenerator.js
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

/**
 * Genera un archivo PNG con el QR de un payload (string u objeto)
 * @param {string|object} payload - Datos a codificar en el QR
 * @param {string} filename - Nombre de archivo (ej. "membresia_123.png")
 * @returns {Promise<string>} - Ruta absoluta del archivo generado
 */
async function generarQRArchivo(payload, filename = "qr.png") {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);

  const dir = path.join(process.cwd(), "uploads", "qrs");
  await fs.promises.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, filename);
  await QRCode.toFile(filePath, data, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 2,
    width: 320,
  });

  return filePath;
}

// Exportación esencial que faltaba
export { generarQRArchivo };
