// Generador de QR para reportes
// Este archivo se crea para resolver la dependencia faltante

import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export const generarQRReporte = async (data, filename = 'reporte-qr.png') => {
  try {
    const qrPath = path.join('./public/', filename);

    // Crear directorio si no existe
    const qrDir = path.dirname(qrPath);
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    // Generar QR
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
