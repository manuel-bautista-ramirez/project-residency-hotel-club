/**
 * @file reportsController.js
 * @description Controlador para la generación y visualización de reportes de membresías.
 * @module controllers/reportsController
 */

import { MembershipService } from "../services/membershipService.js";

/**
 * Objeto controlador para las operaciones relacionadas con los reportes.
 * @type {object}
 */
const reportsController = {
  /**
   * Obtiene los datos para la vista previa de un reporte.
   * @async
   * @param {import('express').Request} req - El objeto de solicitud de Express. Se esperan `period` y `date` en `req.query`.
   * @param {import('express').Response} res - El objeto de respuesta de Express.
   * @returns {Promise<void>}
   */
  async getReportPreview(req, res) {
    try {
      // Extrae los parámetros de la consulta (query string)
      const { period, date } = req.query;
      // Llama al servicio para obtener los datos del reporte
      const reportData = await MembershipService.getReportPreviewData(period, date);
      // Envía los datos en formato JSON
      res.json(reportData);
    } catch (error) {
      console.error("Error generating report preview:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || "Failed to generate report preview" });
    }
  },

  /**
   * Genera y envía un reporte en formato PDF para su descarga.
   * @async
   * @param {import('express').Request} req - El objeto de solicitud de Express. Se esperan `period` y `date` en `req.query`.
   * @param {import('express').Response} res - El objeto de respuesta de Express.
   * @returns {Promise<void>}
   */
  async downloadReportPDF(req, res) {
    try {
      const { period, date } = req.query;
      // Llama al servicio para generar el PDF y obtener el buffer y el nombre del archivo
      const { pdf, filename } = await MembershipService.generateReportPDF(period, date);

      // Configura las cabeceras HTTP para indicar que la respuesta es un archivo PDF descargable
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      // Envía el buffer del PDF como cuerpo de la respuesta
      res.send(pdf);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      // Manejo de errores específicos (ej. validación o sin datos)
      if (error.isValidationError || error.isNoDataError) {
        // Redirige al usuario a la página de reportes con un mensaje de error amigable en la URL
        return res.redirect(`/memberships/reports?error=${encodeURIComponent(error.message)}`);
      }
      // Para otros errores, envía una respuesta genérica de servidor
      res.status(500).send("Failed to generate PDF report");
    }
  },

  /**
   * Renderiza la página de reportes, verificando los permisos del usuario.
   * @async
   * @param {import('express').Request} req - El objeto de solicitud de Express.
   * @param {import('express').Response} res - El objeto de respuesta de Express.
   * @returns {Promise<void>}
   */
  async renderReports(req, res) {
    // Obtiene el rol del usuario de la sesión, con un valor por defecto
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";

    // Verifica si el usuario tiene permisos de administrador
    if (!isAdmin) {
      // Si no es admin, renderiza una página de error de acceso denegado (403 Forbidden)
      return res.status(403).render('error', {
        title: "Acceso Denegado",
        message: "No tienes permiso para acceder a esta página."
      });
    }

    // Extrae cualquier mensaje de error de la query string (útil para la redirección en downloadReportPDF)
    const { error } = req.query;
    // Renderiza la vista 'reports' y le pasa las variables necesarias
    res.render("reports", {
      title: "Reportes",
      showFooter: true,
      isAdmin,
      userRole,
      error: error || null, // Asegura que 'error' no sea undefined en la plantilla
    });
  },
};

export { reportsController };