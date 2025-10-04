import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import directoryManager from '../../../utils/directoryManager.js';
import pdfRegistry from '../models/pdfRegistry.js';

class PDFGenerator {
  constructor() {
    this.ensureDirectories();
  }

  // Asegurar que existan los directorios necesarios
  ensureDirectories() {
    directoryManager.ensureDirectories();
  }

  // Generar código QR con información de la renta
  async generateQRCode(rentData) {
    try {
      const qrData = {
        type: rentData.type || 'rent_receipt',
        id: rentData.id,
        client: rentData.client_name,
        room: rentData.room_number,
        checkIn: rentData.check_in,
        checkOut: rentData.check_out,
        total: rentData.total,
        timestamp: new Date().toISOString()
      };

      const qrString = JSON.stringify(qrData);
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando QR:', error);
      return null;
    }
  }

  // Generar HTML del comprobante
  generateReceiptHTML(rentData, qrCodeDataURL) {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const calculateNights = (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return 0;
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      if (isNaN(start) || isNaN(end)) return 0;
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const nights = calculateNights(rentData.check_in, rentData.check_out);

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprobante de Renta</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Arial', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
            }

            .receipt-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }

            .header {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                padding: 30px;
                text-align: center;
                position: relative;
            }

            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
            }

            .hotel-name {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 5px;
                position: relative;
                z-index: 1;
            }

            .receipt-title {
                font-size: 18px;
                opacity: 0.9;
                position: relative;
                z-index: 1;
            }

            .receipt-id {
                position: absolute;
                top: 15px;
                right: 20px;
                background: rgba(255,255,255,0.2);
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
            }

            .content {
                padding: 30px;
            }

            .client-info {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 25px;
                border-left: 4px solid #4facfe;
            }

            .client-name {
                font-size: 22px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }

            .client-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-top: 15px;
            }

            .detail-item {
                display: flex;
                flex-direction: column;
            }

            .detail-label {
                font-size: 12px;
                color: #7f8c8d;
                text-transform: uppercase;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .detail-value {
                font-size: 16px;
                color: #2c3e50;
                font-weight: 600;
            }

            .stay-info {
                background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 25px;
                text-align: center;
            }

            .stay-dates {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 15px;
                align-items: center;
                margin-bottom: 15px;
            }

            .date-box {
                background: white;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .date-label {
                font-size: 12px;
                color: #e67e22;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .date-value {
                font-size: 14px;
                color: #2c3e50;
                font-weight: 600;
            }

            .arrow {
                font-size: 24px;
                color: #e67e22;
            }

            .nights-info {
                background: white;
                border-radius: 8px;
                padding: 10px;
                display: inline-block;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .nights-number {
                font-size: 24px;
                font-weight: bold;
                color: #e67e22;
            }

            .nights-text {
                font-size: 12px;
                color: #7f8c8d;
            }

            .payment-info {
                background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 25px;
                text-align: center;
            }

            .total-amount {
                font-size: 36px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }

            .payment-method {
                background: white;
                border-radius: 8px;
                padding: 10px 20px;
                display: inline-block;
                font-weight: 600;
                color: #27ae60;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .qr-section {
                text-align: center;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                margin-bottom: 20px;
            }

            .qr-title {
                font-size: 16px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 15px;
            }

            .qr-code {
                display: inline-block;
                padding: 15px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }

            .qr-code img {
                width: 150px;
                height: 150px;
            }

            .footer {
                text-align: center;
                padding: 20px;
                background: #ecf0f1;
                color: #7f8c8d;
                font-size: 12px;
            }

            .footer-note {
                margin-bottom: 10px;
                font-style: italic;
            }

            .timestamp {
                font-weight: bold;
                color: #95a5a6;
            }

            @media print {
                body {
                    background: white;
                    padding: 0;
                }

                .receipt-container {
                    box-shadow: none;
                    max-width: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="header">
                <div class="receipt-id">#${rentData.id}</div>
                <div class="hotel-name">Hotel Residency Club</div>
                <div class="receipt-title">${rentData.type === 'reservation' ? 'Comprobante de Reservación' : 'Comprobante de Renta'}</div>
            </div>

            <div class="content">
                <div class="client-info">
                    <div class="client-name">${rentData.client_name}</div>
                    <div class="client-details">
                        <div class="detail-item">
                            <div class="detail-label">Habitación</div>
                            <div class="detail-value">#${rentData.room_number}</div>
                        </div>
                        <div class="detail-item">
                </div>
                <div class="detail-item">
                  <div class="detail-label">Teléfono</div>
                  <div class="detail-value">${rentData.phone}</div>
                </div>
              </div>
            </div>

            <div class="stay-info">
              <div class="stay-dates">
                <div class="date-box">
                  <div class="date-label">CHECK-IN</div>
                  <div class="date-value">${rentData.check_in ? formatDate(rentData.check_in) : '—'}</div>
                </div>
                <div class="nights-indicator">
                  <div class="nights-value">${calculateNights(rentData.check_in, rentData.check_out)}</div>
                  <div class="nights-label">NOCHES</div>
                </div>
                <div class="date-box">
                  <div class="date-label">CHECK-OUT</div>
                  <div class="date-value">${rentData.check_out ? formatDate(rentData.check_out) : '—'}</div>
                </div>
              </div>

              <div class="price-section">
                <div class="price-value">$${Number(rentData.total || 0).toFixed(2)} MXN</div>
                <div class="payment-badge ${rentData.payment_method === 'Transferencia' ? 'transfer' : (rentData.payment_method === 'Tarjeta' || rentData.payment_method === 'Card' ? 'card' : 'cash')}">
                  ${rentData.payment_method || 'Pendiente'}
                </div>
              </div>

              ${rentData.type === 'reservation' && rentData.reservation_created_at ? `
              <div class="qr-section">
                <div class="qr-title">Fecha de Reservación</div>
                <div class="footer-note">${formatDate(rentData.reservation_created_at)}</div>
              </div>
              ` : ''}

              ${qrCodeDataURL ? `
              <div class="qr-section">
                <div class="qr-title">Código QR de Verificación</div>
                <div class="qr-code">
                    <img src="${qrCodeDataURL}" alt="QR Code" />
                </div>
              </div>
              ` : ''}
            </div>

            <div class="footer">
                <div class="footer-note">Gracias por elegir Hotel Residency Club</div>
                <div class="timestamp">Generado el ${new Date().toLocaleString('es-MX')}</div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generar PDF usando Puppeteer
  async generatePDF(rentData) {
    try {
      console.log(`🔄 Generando PDF para ${rentData.type === 'reservation' ? 'reservación' : 'renta'} ID:`, rentData.id);

      // Generar código QR
      const qrCodeDataURL = await this.generateQRCode(rentData);

      // Generar HTML
      const htmlContent = this.generateReceiptHTML(rentData, qrCodeDataURL);

      // Importar Puppeteer dinámicamente
      const puppeteer = await import('puppeteer');

      // Lanzar navegador
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Establecer contenido HTML
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await browser.close();

      // Guardar PDF usando directoryManager
      const timestamp = Date.now();
      const fileName = directoryManager.generatePDFFileName(rentData.type || 'rent', rentData.id, timestamp);
      const filePath = directoryManager.getPDFFilePath(rentData.type || 'rent', rentData.id, timestamp);

      fs.writeFileSync(filePath, pdfBuffer);

      console.log('✅ PDF generado exitosamente:', filePath);

      // Registrar PDF en la base de datos
      const qrData = await this.generateQRCode(rentData);
      const registryResult = await pdfRegistry.registerPDF({
        rent_id: rentData.id,
        client_name: rentData.client_name,
        phone: rentData.phone,
        room_number: rentData.room_number,
        file_name: fileName,
        file_path: filePath,
        qr_data: {
          type: rentData.type === 'reservation' ? 'reservation_receipt' : 'rent_receipt',
          id: rentData.id,
          client: rentData.client_name,
          room: rentData.room_number,
          checkIn: rentData.check_in,
          checkOut: rentData.check_out,
          total: rentData.total,
          timestamp: new Date().toISOString()
        }
      });

      if (registryResult.success) {
        console.log('✅ PDF registrado en base de datos - ID:', registryResult.registry_id);
      } else {
        console.warn('⚠️ Error registrando PDF:', registryResult.error);
      }

      return {
        success: true,
        filePath: filePath,
        fileName: fileName,
        fullPath: path.resolve(filePath),
        registry_id: registryResult.registry_id
      };

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new PDFGenerator();
