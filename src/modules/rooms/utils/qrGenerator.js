// utils/qrGenerator.js
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

/**
 * Export principal para generar un QR
 */
export const generateQR = async (data, filename = 'reporte-qr.png') => {
  try {
    const qrDir = path.join('./public/');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrPath = path.join(qrDir, filename);

    await QRCode.toFile(qrPath, JSON.stringify(data), {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log(`✅ QR generado: ${qrPath}`);
    return qrPath;
  } catch (error) {
    console.error('❌ Error generando QR:', error);
    throw error;
  }
};

/**
 * Alias para mantener compatibilidad con código que usaba generarQRReporte
 */
export const generarQRReporte = generateQR;

/**
 * Función para generar payload de reporte
 */
export const generarPayloadReporte = (tipoReporte, datos, fechas = {}) => {
  return {
    tipo: tipoReporte,
    fecha_generacion: new Date().toISOString(),
    periodo: fechas,
    resumen: {
      total_registros: datos.length,
      total_ingresos: datos.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    },
    url_descarga: `/reportes/${tipoReporte}/${Date.now()}`
  };
};
