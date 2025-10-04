import fs from 'fs';
import path from 'path';

class DirectoryManager {
  constructor() {
    this.baseUploadPath = './public/uploads';
    this.directories = {
      // QR Codes
      qr: {
        rentas: 'rooms/qr/rentas',
        reservaciones: 'rooms/qr/reservaciones'
      },
      // PDFs
      pdf: {
        rentas: 'rooms/pdf/rentas', 
        reservaciones: 'rooms/pdf/reservaciones'
      },
      // Receipts generales (mantener compatibilidad)
      receipts: 'receipts'
    };
  }

  // Crear todas las carpetas necesarias
  ensureDirectories() {
    try {
      // Crear directorio base
      if (!fs.existsSync(this.baseUploadPath)) {
        fs.mkdirSync(this.baseUploadPath, { recursive: true });
      }

      // Crear estructura de QR
      Object.values(this.directories.qr).forEach(dir => {
        const fullPath = path.join(this.baseUploadPath, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`📁 Directorio creado: ${fullPath}`);
        }
      });

      // Crear estructura de PDF
      Object.values(this.directories.pdf).forEach(dir => {
        const fullPath = path.join(this.baseUploadPath, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`📁 Directorio creado: ${fullPath}`);
        }
      });

      // Crear directorio de receipts (compatibilidad)
      const receiptsPath = path.join(this.baseUploadPath, this.directories.receipts);
      if (!fs.existsSync(receiptsPath)) {
        fs.mkdirSync(receiptsPath, { recursive: true });
        console.log(`📁 Directorio creado: ${receiptsPath}`);
      }

      console.log('✅ Estructura de directorios verificada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error creando directorios:', error);
      return false;
    }
  }

  // Obtener ruta para QR según tipo
  getQRPath(type) {
    const dirMap = {
      'rent': this.directories.qr.rentas,
      'renta': this.directories.qr.rentas,
      'reservation': this.directories.qr.reservaciones,
      'reservacion': this.directories.qr.reservaciones
    };
    
    const dir = dirMap[type] || this.directories.qr.rentas;
    return path.join(this.baseUploadPath, dir);
  }

  // Obtener ruta para PDF según tipo
  getPDFPath(type) {
    const dirMap = {
      'rent': this.directories.pdf.rentas,
      'renta': this.directories.pdf.rentas,
      'reservation': this.directories.pdf.reservaciones,
      'reservacion': this.directories.pdf.reservaciones
    };
    
    const dir = dirMap[type] || this.directories.pdf.rentas;
    return path.join(this.baseUploadPath, dir);
  }

  // Obtener ruta de receipts (compatibilidad)
  getReceiptsPath() {
    return path.join(this.baseUploadPath, this.directories.receipts);
  }

  // Generar nombre de archivo QR
  generateQRFileName(type, id, timestamp = Date.now()) {
    const typeMap = {
      'rent': 'renta',
      'renta': 'renta',
      'reservation': 'reservacion',
      'reservacion': 'reservacion'
    };
    
    const fileType = typeMap[type] || 'renta';
    return `qr_${fileType}_${id}_${timestamp}.png`;
  }

  // Generar nombre de archivo PDF
  generatePDFFileName(type, id, timestamp = Date.now()) {
    const typeMap = {
      'rent': 'renta',
      'renta': 'renta', 
      'reservation': 'reservacion',
      'reservacion': 'reservacion'
    };
    
    const fileType = typeMap[type] || 'renta';
    return `comprobante_${fileType}_${id}_${timestamp}.pdf`;
  }

  // Obtener ruta completa para QR
  getQRFilePath(type, id, timestamp = Date.now()) {
    const dir = this.getQRPath(type);
    const fileName = this.generateQRFileName(type, id, timestamp);
    return path.join(dir, fileName);
  }

  // Obtener ruta completa para PDF
  getPDFFilePath(type, id, timestamp = Date.now()) {
    const dir = this.getPDFPath(type);
    const fileName = this.generatePDFFileName(type, id, timestamp);
    return path.join(dir, fileName);
  }

  // Limpiar archivos antiguos (opcional)
  cleanupOldFiles(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let cleanedCount = 0;
    
    // Limpiar QRs antiguos
    Object.values(this.directories.qr).forEach(dir => {
      const fullPath = path.join(this.baseUploadPath, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
          const filePath = path.join(fullPath, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            cleanedCount++;
          }
        });
      }
    });

    // Limpiar PDFs antiguos
    Object.values(this.directories.pdf).forEach(dir => {
      const fullPath = path.join(this.baseUploadPath, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
          const filePath = path.join(fullPath, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            cleanedCount++;
          }
        });
      }
    });

    console.log(`🧹 Limpieza completada: ${cleanedCount} archivos eliminados`);
    return cleanedCount;
  }

  // Obtener estadísticas de uso
  getStorageStats() {
    const stats = {
      qr: { rentas: 0, reservaciones: 0 },
      pdf: { rentas: 0, reservaciones: 0 },
      receipts: 0
    };

    // Contar QRs
    Object.entries(this.directories.qr).forEach(([key, dir]) => {
      const fullPath = path.join(this.baseUploadPath, dir);
      if (fs.existsSync(fullPath)) {
        stats.qr[key] = fs.readdirSync(fullPath).length;
      }
    });

    // Contar PDFs
    Object.entries(this.directories.pdf).forEach(([key, dir]) => {
      const fullPath = path.join(this.baseUploadPath, dir);
      if (fs.existsSync(fullPath)) {
        stats.pdf[key] = fs.readdirSync(fullPath).length;
      }
    });

    // Contar receipts
    const receiptsPath = path.join(this.baseUploadPath, this.directories.receipts);
    if (fs.existsSync(receiptsPath)) {
      stats.receipts = fs.readdirSync(receiptsPath).length;
    }

    return stats;
  }
}

export default new DirectoryManager();
