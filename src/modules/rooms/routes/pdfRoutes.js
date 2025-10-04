import express from 'express';
import {
  getByRentId,
  getByClient,
  downloadPDF,
  viewPDF,
  stats,
  list,
  verify,
  cleanup,
  exportRegistry,
  search
} from '../controllers/pdfController.js';

const router = express.Router();

// Middleware para verificar autenticación
export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
};

// Obtener PDF por ID de renta
router.get('/rent/:rent_id', requireAuth, getByRentId);

// Obtener PDFs por cliente
router.get('/client/:client_name', requireAuth, getByClient);

// Descargar PDF
router.get('/download/:rent_id', requireAuth, downloadPDF);

// Ver PDF en el navegador
router.get('/view/:rent_id', requireAuth, viewPDF);

// Obtener estadísticas de PDFs
router.get('/stats', requireAuth, stats);

// Listar todos los PDFs (con paginación)
router.get('/list', requireAuth, list);

// Verificar integridad de archivos
router.get('/verify', requireAuth, verify);

// Limpiar PDFs antiguos
router.post('/cleanup', requireAuth, cleanup);

// Exportar registro completo
router.get('/export', requireAuth, exportRegistry);

// Buscar PDFs
router.get('/search', requireAuth, search);

export default router;
