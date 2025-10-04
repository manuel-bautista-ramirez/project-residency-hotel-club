import fs from 'fs';
import path from 'path';

class QRScanner {
  constructor() {
    this.validatedReceipts = new Map(); // Cache de comprobantes validados
  }

  // Validar código QR de comprobante
  validateQRCode(qrData) {
    try {
      // Parsear datos del QR
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

      // Validaciones básicas
      if (!data || typeof data !== 'object') {
        return {
          valid: false,
          error: 'Formato de QR inválido'
        };
      }

      // Verificar campos requeridos
      const requiredFields = ['type', 'id', 'client', 'room', 'checkIn', 'checkOut', 'total', 'timestamp'];
      const missingFields = requiredFields.filter(field => !data[field]);

      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `Campos faltantes: ${missingFields.join(', ')}`
        };
      }

      // Verificar tipo de comprobante
      if (data.type !== 'rent_receipt') {
        return {
          valid: false,
          error: 'Tipo de comprobante no válido'
        };
      }

      // Verificar fechas
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      const timestamp = new Date(data.timestamp);

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || isNaN(timestamp.getTime())) {
        return {
          valid: false,
          error: 'Fechas inválidas en el comprobante'
        };
      }

      // Verificar que check-out sea después de check-in
      if (checkOut <= checkIn) {
        return {
          valid: false,
          error: 'Fechas de estancia inválidas'
        };
      }

      // Verificar que el comprobante no sea muy antiguo (más de 1 año)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (timestamp < oneYearAgo) {
        return {
          valid: false,
          error: 'Comprobante expirado'
        };
      }

      // Generar hash único para el comprobante
      const receiptHash = this.generateReceiptHash(data);

      // Marcar como validado
      this.validatedReceipts.set(receiptHash, {
        ...data,
        validatedAt: new Date().toISOString(),
        validatedBy: 'QR Scanner'
      });

      return {
        valid: true,
        data: data,
        hash: receiptHash,
        message: 'Comprobante válido'
      };

    } catch (error) {
      return {
        valid: false,
        error: `Error procesando QR: ${error.message}`
      };
    }
  }

  // Generar hash único para el comprobante
  generateReceiptHash(data) {
    const hashString = `${data.type}_${data.id}_${data.client}_${data.timestamp}`;
    return Buffer.from(hashString).toString('base64').substring(0, 16);
  }

  // Obtener información detallada del comprobante
  getReceiptDetails(qrData) {
    const validation = this.validateQRCode(qrData);

    if (!validation.valid) {
      return validation;
    }

    const data = validation.data;
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    return {
      valid: true,
      receipt: {
        id: data.id,
        type: 'Comprobante de Renta',
        client: {
          name: data.client
        },
        reservation: {
          room: data.room,
          checkIn: checkIn.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          checkOut: checkOut.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          nights: nights,
          nightsText: nights === 1 ? 'noche' : 'noches'
        },
        payment: {
          total: parseFloat(data.total).toFixed(2),
          currency: 'MXN'
        },
        metadata: {
          generatedAt: new Date(data.timestamp).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          hash: validation.hash,
          status: 'Verificado ✅'
        }
      }
    };
  }

  // Verificar si un comprobante ya fue validado
  isReceiptValidated(qrData) {
    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      const hash = this.generateReceiptHash(data);
      return this.validatedReceipts.has(hash);
    } catch (error) {
      return false;
    }
  }

  // Obtener estadísticas de validaciones
  getValidationStats() {
    const validatedCount = this.validatedReceipts.size;
    const validatedReceipts = Array.from(this.validatedReceipts.values());

    return {
      totalValidated: validatedCount,
      recentValidations: validatedReceipts
        .sort((a, b) => new Date(b.validatedAt) - new Date(a.validatedAt))
        .slice(0, 10),
      validationsByDay: this.groupValidationsByDay(validatedReceipts)
    };
  }

  // Agrupar validaciones por día
  groupValidationsByDay(validations) {
    const groups = {};

    validations.forEach(validation => {
      const date = new Date(validation.validatedAt).toDateString();
      if (!groups[date]) {
        groups[date] = 0;
      }
      groups[date]++;
    });

    return groups;
  }

  // Limpiar cache de validaciones antiguas
  cleanupOldValidations() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    let cleanedCount = 0;

    for (const [hash, validation] of this.validatedReceipts.entries()) {
      const validatedAt = new Date(validation.validatedAt);
      if (validatedAt < oneDayAgo) {
        this.validatedReceipts.delete(hash);
        cleanedCount++;
      }
    }

    console.log(`🧹 Limpieza completada: ${cleanedCount} validaciones antiguas eliminadas`);
    return cleanedCount;
  }

  // Exportar datos de validación para auditoría
  exportValidationData() {
    const data = {
      exportDate: new Date().toISOString(),
      totalValidations: this.validatedReceipts.size,
      validations: Array.from(this.validatedReceipts.values())
    };

    const fileName = `validations_export_${Date.now()}.json`;
    const filePath = path.join('./public/uploads/qrs', fileName);

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return {
        success: true,
        filePath: filePath,
        fileName: fileName,
        recordCount: data.totalValidations
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new QRScanner();
