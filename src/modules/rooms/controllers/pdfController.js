// src/modules/rooms/controllers/pdfController.js
import fs from 'fs';
import pdfRegistry from '../models/pdfRegistry.js';

// GET /api/pdfs/rent/:rent_id
export async function getByRentId(req, res) {
  try {
    const { rent_id } = req.params;
    const result = await pdfRegistry.getPDFByRentId(rent_id);
    if (result.success) return res.json(result.pdf);
    return res.status(404).json({ error: result.message });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/pdfs/client/:client_name
export async function getByClient(req, res) {
  try {
    const { client_name } = req.params;
    const result = await pdfRegistry.getPDFsByClient(client_name);
    if (result.success) {
      return res.json({ client: client_name, count: result.count, pdfs: result.pdfs });
    }
    return res.status(404).json({ error: result.error });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/pdfs/download/:rent_id
export async function downloadPDF(req, res) {
  try {
    const { rent_id } = req.params;
    const result = await pdfRegistry.getPDFByRentId(rent_id);
    if (result.success && result.pdf.file_exists) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.pdf.file_name}"`);
      return fs.createReadStream(result.pdf.file_path).pipe(res);
    }
    return res.status(404).json({
      error: result.pdf?.file_exists === false ? 'Archivo PDF no encontrado en el sistema' : 'PDF no encontrado para esta renta'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/pdfs/view/:rent_id
export async function viewPDF(req, res) {
  try {
    const { rent_id } = req.params;
    const result = await pdfRegistry.getPDFByRentId(rent_id);
    if (result.success && result.pdf.file_exists) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      return fs.createReadStream(result.pdf.file_path).pipe(res);
    }
    return res.status(404).json({
      error: result.pdf?.file_exists === false ? 'Archivo PDF no encontrado en el sistema' : 'PDF no encontrado para esta renta'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/pdfs/stats
export async function stats(req, res) {
  try {
    const result = await pdfRegistry.getPDFStats();
    if (result.success) return res.json(result);
    return res.status(500).json({ error: result.error });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/pdfs/list
export async function list(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await pdfRegistry.listPDFs(page, limit);
    if (result.success) return res.json(result);
    return res.status(500).json({ error: result.error });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/pdfs/verify
export async function verify(req, res) {
  try {
    const result = await pdfRegistry.verifyFileIntegrity();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/pdfs/cleanup
export async function cleanup(req, res) {
  try {
    const { days = 30 } = req.body;
    const result = await pdfRegistry.cleanupOldPDFs(days);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/pdfs/export
export async function exportRegistry(req, res) {
  try {
    const result = await pdfRegistry.exportRegistry();
    if (!result.success) return res.status(500).json({ error: result.error });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${result.file_name}"`);
    return fs.createReadStream(result.file_path).pipe(res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/pdfs/search
export async function search(req, res) {
  try {
    const { q, type = 'client' } = req.query;
    if (!q) return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
    const result = await pdfRegistry.searchPDFs(q, type);
    if (result.success) return res.json(result);
    return res.status(400).json({ error: result.error });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
