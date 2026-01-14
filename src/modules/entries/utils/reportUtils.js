import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import validadorDirectorios from './validadorDirectorios.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



/**
 * Genera el HTML completo para el PDF del reporte.
 * @param {object} data - Datos para el reporte (periodo, fechas, stats)
 * @returns {string} - HTML completo
 */
export const generateReportHTML = (data) => {
  const { periodo, fechaInicio, fechaFin, stats } = data;
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Ingresos</title>
      <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
        .header h1 { color: #4f46e5; margin: 0; font-size: 28px; }
        .header p { color: #666; font-size: 14px; margin-top: 5px; }
        .info-card { background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e5e7eb; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #6b7280; }
        .info-value { font-weight: bold; color: #111827; }
        .stats-grid { display: flex; gap: 20px; margin-bottom: 30px; }
        .stat-box { flex: 1; padding: 20px; border-radius: 12px; text-align: center; color: white; }
        .stat-box.blue { background-color: #3b82f6; }
        .stat-box.green { background-color: #10b981; }
        .stat-box.orange { background-color: #f59e0b; }
        .stat-value { font-size: 24px; font-weight: bold; margin-top: 10px; }
        .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>RESIDENCY HOTEL CLUB</h1>
        <p>Reporte Oficial de Ingresos</p>
      </div>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">PERIODO:</span>
          <span class="info-value" style="text-transform: uppercase;">${periodo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">RANGO DE FECHAS:</span>
          <span class="info-value">${fechaInicio} - ${fechaFin}</span>
        </div>
        <div class="info-row">
          <span class="info-label">INGRESO TOTAL GLOBAL:</span>
          <span class="info-value" style="color: #4f46e5; font-size: 18px;">$${stats.totalGlobal}</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-box blue">
          <div class="stat-label">Canchas</div>
          <div class="stat-value">$${stats.totalCanchas}</div>
        </div>
        <div class="stat-box green">
          <div class="stat-label">Alberca</div>
          <div class="stat-value">$${stats.totalAlberca}</div>
        </div>
        <div class="stat-box orange">
          <div class="stat-label">Gimnasio</div>
          <div class="stat-value">$${stats.totalGym}</div>
        </div>
      </div>

      <div class="footer">
        <p>Generado automáticamente el ${new Date().toLocaleString('es-MX')}</p>
        <p>Este documento es un comprobante oficial de los ingresos registrados en el sistema.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera el cuerpo HTML para los correos de reportes.
 * @param {string} periodo - El periodo del reporte (diario, semanal, etc.)
 * @param {string} fechaInicio - Fecha de inicio formateada
 * @param {string} fechaFin - Fecha de fin formateada
 * @param {object} stats - Estadísticas para incluir en el cuerpo
 * @returns {string} - HTML del correo
 */
export const generateReportEmailBody = (periodo, fechaInicio, fechaFin, stats) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4f46e5;">Reporte de Ingresos - Hotel Club</h2>
      <p>Adjunto encontrarás el reporte de ingresos solicitado.</p>

      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Periodo:</strong> ${periodo.toUpperCase()}</p>
        <p><strong>Fechas:</strong> ${fechaInicio} - ${fechaFin}</p>
        <p><strong>Total Ingresos:</strong> $${stats.totalGlobal}</p>
      </div>

      <h3>Resumen por Área:</h3>
      <ul>
        <li><strong>Canchas:</strong> $${stats.totalCanchas}</li>
        <li><strong>Alberca:</strong> $${stats.totalAlberca}</li>
        <li><strong>Gimnasio:</strong> $${stats.totalGym}</li>
      </ul>

      <p style="font-size: 12px; color: #888; margin-top: 30px;">
        Este es un correo automático generado por el sistema de administración.
      </p>
    </div>
  `;
};

/**
 * Genera el mensaje de texto para WhatsApp.
 * @param {string} periodo - El periodo del reporte
 * @param {string} fechaInicio - Fecha de inicio
 * @param {string} fechaFin - Fecha de fin
 * @param {object} stats - Estadísticas
 * @returns {string} - Texto del mensaje
 */
export const generateReportWhatsAppMessage = (periodo, fechaInicio, fechaFin, stats) => {
  return `📊 *REPORTE DE INGRESOS* 📊
━━━━━━━━━━━━━━━━━━
📅 *Periodo:* ${periodo.toUpperCase()}
📆 *Fechas:* ${fechaInicio} - ${fechaFin}
━━━━━━━━━━━━━━━━━━
💰 *INGRESO TOTAL:* $${stats.totalGlobal}

*Desglose por Área:*
🎾 Canchas: $${stats.totalCanchas}
🏊 Alberca: $${stats.totalAlberca}
💪 Gimnasio: $${stats.totalGym}
━━━━━━━━━━━━━━━━━━
📎 _Se adjunta el reporte detallado en PDF_`;
};

/**
 * Genera un PDF a partir de una vista HTML renderizada.
 * Utiliza Puppeteer para capturar el contenido y guardar el archivo.
 * @param {string} htmlContent - El contenido HTML a convertir
 * @param {string} fileName - Nombre del archivo de salida
 * @returns {Promise<string>} - Ruta del archivo generado
 */
export const generateReportPDF = async (htmlContent, fileName) => {
  try {
    // 1. Validar y asegurar que existe el directorio de reportes
    const isDirValid = validadorDirectorios.validarRutaEspecifica('pdf', 'reportes');
    if (!isDirValid) {
      throw new Error("No se pudo validar/crear el directorio de reportes");
    }

    // 2. Obtener la ruta final
    const reportsDir = validadorDirectorios.obtenerRuta('pdf', 'reportes');
    const filePath = path.join(reportsDir, fileName);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // Inyectar estilos básicos si no están presentes o renderizar completo
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });

      console.log(`✅ PDF generado correctamente en: ${filePath}`);
      return filePath;

    } catch (error) {
      console.error('Error generando PDF con Puppeteer:', error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  } catch (error) {
    console.error('Error en generateReportPDF:', error);
    throw error;
  }
};
