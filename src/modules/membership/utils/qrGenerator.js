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
async function generarQRArchivo(
  payload,
  membershipId = "",
  titularNombre = "",
  filename = ""
) {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);

  // Guardar en public/uploads/qrs/
  const dir = path.join(process.cwd(), "public", "uploads", "qrs");
  await fs.promises.mkdir(dir, { recursive: true });

  // Generar nombre de archivo automático si no se proporciona
  let finalFilename = filename;
  if (!finalFilename && membershipId && titularNombre) {
    const cleanName = titularNombre
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 20);
    finalFilename = `qr_${membershipId}_${cleanName}.png`;
  } else if (!finalFilename) {
    finalFilename = `qr_${Date.now()}.png`;
  }

  const filePath = path.join(dir, finalFilename);

  await QRCode.toFile(filePath, data, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 2,
    width: 320,
    color: {
      dark: "#16a34a",
      light: "#FFFFFF",
    },
  });

  // Retornar la ruta relativa desde public/
  return `/uploads/qrs/${finalFilename}`;
}

// Exportación esencial que faltaba
export { generarQRArchivo };
