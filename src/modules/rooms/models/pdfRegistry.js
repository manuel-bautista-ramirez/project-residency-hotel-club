import fs from 'fs';
import path from 'path';
import { executeQuery } from '../../../dataBase/connectionDataBase.js';

class PDFRegistry {
  constructor() {
    // La creación de tablas se gestiona fuera de este servicio (scripts/migraciones)
  }

  // Listar PDFs con paginación
  async listPDFs(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT id, rent_id, client_name, phone, room_number,
               file_name, file_path, file_size, generated_at,
               sent_whatsapp, sent_email, status
        FROM pdf_registry
        ORDER BY generated_at DESC
        LIMIT ? OFFSET ?`;

      const countQuery = 'SELECT COUNT(*) as total FROM pdf_registry';
      const [records, countRows] = await Promise.all([
        executeQuery(query, [limit, offset]),
        executeQuery(countQuery)
      ]);

      const total = countRows[0].total;
      const totalPages = Math.ceil(total / limit);

      const recordsWithStatus = records.map(record => ({
        ...record,
        file_exists: fs.existsSync(record.file_path || ''),
        file_size_mb: record.file_size ? (record.file_size / 1024 / 1024).toFixed(2) : '0'
      }));

      return {
        success: true,
        records: recordsWithStatus,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_records: total,
          records_per_page: limit
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Buscar PDFs por cliente, teléfono o habitación
  async searchPDFs(q, type = 'client') {
    try {
      let query, params;
      switch (type) {
        case 'client':
          query = `
            SELECT * FROM pdf_registry
            WHERE client_name LIKE ?
            ORDER BY generated_at DESC`;
          params = [`%${q}%`];
          break;
        case 'phone':
          query = `
            SELECT * FROM pdf_registry
            WHERE phone LIKE ?
            ORDER BY generated_at DESC`;
          params = [`%${q}%`];
          break;
        case 'room':
          query = `
            SELECT * FROM pdf_registry
            WHERE room_number LIKE ?
            ORDER BY generated_at DESC`;
          params = [`%${q}%`];
          break;
        default:
          return { success: false, error: 'Tipo de búsqueda no válido' };
      }

      const results = await executeQuery(query, params);
      const recordsWithStatus = results.map(record => ({
        ...record,
        qr_data: JSON.parse(record.qr_data || '{}'),
        file_exists: fs.existsSync(record.file_path || ''),
        file_size_mb: record.file_size ? (record.file_size / 1024 / 1024).toFixed(2) : '0'
      }));

      return {
        success: true,
        search_term: q,
        search_type: type,
        results: recordsWithStatus,
        count: recordsWithStatus.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async registerPDF(pdfData) {
    try {
      const {
        rent_id,
        client_name,
        phone,
        room_number,
        file_name,
        file_path,
        qr_data,
        sent_whatsapp = false,
        sent_email = false
      } = pdfData;

      let file_size = 0;
      try {
        const stats = fs.statSync(file_path);
        file_size = stats.size;
      } catch (error) {
        console.warn('⚠️ No se pudo obtener el tamaño del archivo:', error.message);
      }

      const insertQuery = `
        INSERT INTO pdf_registry (
          rent_id, client_name, phone, room_number,
          file_name, file_path, file_size, qr_data,
          sent_whatsapp, sent_email, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated')
      `;

      const result = await executeQuery(insertQuery, [
        rent_id,
        client_name,
        phone,
        room_number,
        file_name,
        file_path,
        file_size,
        JSON.stringify(qr_data),
        sent_whatsapp,
        sent_email
      ]);

      console.log(`✅ PDF registrado en base de datos - ID: ${result.insertId}`);
      return { success: true, registry_id: result.insertId, message: 'PDF registrado exitosamente' };
    } catch (error) {
      console.error('❌ Error registrando PDF:', error);
      return { success: false, error: error.message };
    }
  }

  async updateWhatsAppStatus(rent_id, sent = true) {
    try {
      const updateQuery = `
        UPDATE pdf_registry SET sent_whatsapp = ?, status = ? WHERE rent_id = ?
      `;
      const status = sent ? 'sent' : 'error';
      await executeQuery(updateQuery, [sent, status, rent_id]);
      console.log(`✅ Estado WhatsApp actualizado para renta ${rent_id}: ${sent ? 'enviado' : 'error'}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando estado WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  async updateEmailStatus(rent_id, sent = true) {
    try {
      const updateQuery = `
        UPDATE pdf_registry SET sent_email = ? WHERE rent_id = ?
      `;
      await executeQuery(updateQuery, [sent, rent_id]);
      console.log(`✅ Estado Email actualizado para renta ${rent_id}: ${sent ? 'enviado' : 'error'}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando estado Email:', error);
      return { success: false, error: error.message };
    }
  }

  async getPDFByRentId(rent_id) {
    try {
      const query = `
        SELECT * FROM pdf_registry WHERE rent_id = ? ORDER BY generated_at DESC LIMIT 1
      `;
      const results = await executeQuery(query, [rent_id]);
      if (results.length > 0) {
        const pdf = results[0];
        const fileExists = fs.existsSync(pdf.file_path);
        return {
          success: true,
          pdf: { ...pdf, qr_data: JSON.parse(pdf.qr_data || '{}'), file_exists: fileExists, file_size_mb: (pdf.file_size / 1024 / 1024).toFixed(2) }
        };
      }
      return { success: false, message: 'PDF no encontrado para esta renta' };
    } catch (error) {
      console.error('❌ Error obteniendo PDF:', error);
      return { success: false, error: error.message };
    }
  }

  async getPDFsByClient(client_name) {
    try {
      const query = `
        SELECT * FROM pdf_registry WHERE client_name LIKE ? ORDER BY generated_at DESC
      `;
      const results = await executeQuery(query, [`%${client_name}%`]);
      const pdfs = results.map(pdf => ({
        ...pdf,
        qr_data: JSON.parse(pdf.qr_data || '{}'),
        file_exists: fs.existsSync(pdf.file_path),
        file_size_mb: (pdf.file_size / 1024 / 1024).toFixed(2)
      }));
      return { success: true, pdfs, count: pdfs.length };
    } catch (error) {
      console.error('❌ Error obteniendo PDFs del cliente:', error);
      return { success: false, error: error.message };
    }
  }

  async getPDFStats() {
    try {
      const queries = {
        total: 'SELECT COUNT(*) as count FROM pdf_registry',
        sent_whatsapp: 'SELECT COUNT(*) as count FROM pdf_registry WHERE sent_whatsapp = TRUE',
        sent_email: 'SELECT COUNT(*) as count FROM pdf_registry WHERE sent_email = TRUE',
        today: 'SELECT COUNT(*) as count FROM pdf_registry WHERE DATE(generated_at) = CURDATE()',
        this_week: 'SELECT COUNT(*) as count FROM pdf_registry WHERE WEEK(generated_at) = WEEK(NOW())',
        file_size: 'SELECT SUM(file_size) as total_size FROM pdf_registry'
      };

      const stats = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await executeQuery(query);
        stats[key] = key === 'file_size' ? (result[0].total_size / 1024 / 1024).toFixed(2) + ' MB' : result[0].count;
      }

      const recentQuery = `
        SELECT rent_id, client_name, file_name, generated_at, status FROM pdf_registry ORDER BY generated_at DESC LIMIT 10
      `;
      const recentPDFs = await executeQuery(recentQuery);
      return { success: true, stats, recent_pdfs: recentPDFs };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { success: false, error: error.message };
    }
  }

  async cleanupOldPDFs(daysOld = 30) {
    try {
      const selectQuery = `
        SELECT file_path FROM pdf_registry WHERE generated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      const oldPDFs = await executeQuery(selectQuery, [daysOld]);
      let deletedFiles = 0;
      let deletedRecords = 0;

      for (const pdf of oldPDFs) {
        try {
          if (fs.existsSync(pdf.file_path)) {
            fs.unlinkSync(pdf.file_path);
            deletedFiles++;
          }
        } catch (error) {
          console.warn(`⚠️ No se pudo eliminar archivo: ${pdf.file_path}`);
        }
      }

      const deleteQuery = `
        DELETE FROM pdf_registry WHERE generated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      const result = await executeQuery(deleteQuery, [daysOld]);
      deletedRecords = result.affectedRows;

      console.log(`🧹 Limpieza completada: ${deletedFiles} archivos y ${deletedRecords} registros eliminados`);
      return { success: true, deleted_files: deletedFiles, deleted_records: deletedRecords };
    } catch (error) {
      console.error('❌ Error en limpieza de PDFs:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyFileIntegrity() {
    try {
      const query = 'SELECT id, file_path FROM pdf_registry';
      const pdfs = await executeQuery(query);
      let existingFiles = 0;
      let missingFiles = 0;
      const missingList = [];
      for (const pdf of pdfs) {
        if (fs.existsSync(pdf.file_path)) {
          existingFiles++;
        } else {
          missingFiles++;
          missingList.push({ id: pdf.id, file_path: pdf.file_path });
        }
      }
      return { success: true, total_records: pdfs.length, existing_files: existingFiles, missing_files: missingFiles, missing_list: missingList };
    } catch (error) {
      console.error('❌ Error verificando integridad:', error);
      return { success: false, error: error.message };
    }
  }

  async exportRegistry() {
    try {
      const query = `
        SELECT rent_id, client_name, phone, room_number, file_name, file_path, file_size, generated_at, sent_whatsapp, sent_email, status
        FROM pdf_registry ORDER BY generated_at DESC
      `;
      const records = await executeQuery(query);
      const exportData = { export_date: new Date().toISOString(), total_records: records.length, records };
      const fileName = `pdf_registry_export_${Date.now()}.json`;
      const filePath = path.join('./public/uploads/receipts', fileName);
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      return { success: true, file_path: filePath, file_name: fileName, record_count: records.length };
    } catch (error) {
      console.error('❌ Error exportando registro:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PDFRegistry();
