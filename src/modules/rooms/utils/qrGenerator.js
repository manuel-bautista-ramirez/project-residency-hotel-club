import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import validadorDirectorios from './validadorDirectorios.js';

export const generarQR = async (datos, tipo) => {
  try {
    // Validar tipo de documento
    const normalizedTipo = tipo.toLowerCase();

    // ✅ CORREGIDO: Mapeo correcto de tipos
    const tipoMap = {
      'renta': 'rentas',
      'reservacion': 'reservaciones',
      'reservation': 'reservaciones'
    };

    const folderTipo = tipoMap[normalizedTipo];

    if (!folderTipo) {
      throw new Error(`Tipo de documento no válido: ${tipo}`);
    }

    // Crear datos para el QR
    const qrData = {
      tipo: folderTipo,
      cliente: datos.nombre || datos.client_name || datos.nombre_cliente,
      monto: datos.monto || datos.amount || datos.price,
      habitacion: datos.habitacion_id,
      fecha: new Date().toISOString(),
      referencia: `ref_${Date.now()}`,
      timestamp: Date.now()
    };

    const qrString = JSON.stringify(qrData);

    // Validar y obtener ruta organizada usando el validador
    const rutaBase = validadorDirectorios.obtenerRuta('qr', folderTipo);
    const qrFileName = `qr_${folderTipo}_${Date.now()}.png`;
    const qrPath = path.join(rutaBase, qrFileName);

    console.log('=== GENERANDO QR ===');
    console.log('Tipo recibido:', tipo);
    console.log('Tipo normalizado:', normalizedTipo);
    console.log('Folder tipo:', folderTipo);
    console.log('Ruta destino:', qrPath);

    // Validar que el directorio existe usando el validador
    if (!validadorDirectorios.validarRutaEspecifica('qr', folderTipo)) {
      throw new Error(`No se pudo validar/crear el directorio para QR: ${rutaBase}`);
    }

    // Generar QR
    await QRCode.toFile(qrPath, qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    console.log(`✅ QR generado exitosamente en: ${qrPath}`);
    return qrPath;
  } catch (error) {
    console.error('❌ Error generando QR:', error);
    throw error;
  }
};
