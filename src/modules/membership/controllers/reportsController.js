/**
 * @file reportsController.js
 * @description Controlador para la generación y visualización de reportes de membresías.
 * @module controllers/reportsController
 */

import { MembershipService } from "../services/membershipService.js";
import emailService from "../../../services/emailService.js";
import whatsappService from "../../../services/whatsappService.js";
import fs from "fs";
import os from "os";
import path from "path";

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

  async sendReportByEmail(req, res) {
    try {
      const { period, date, destinatario, asunto } = req.body;

      if (!destinatario) {
        return res.status(400).json({ success: false, error: "Destinatario requerido" });
      }

      const { pdf, filename } = await MembershipService.generateReportPDF(period, date);

      await emailService.send({
        to: destinatario,
        subject: asunto || `📊 Reporte de Membresías (${period})`,
        text: "Adjunto se encuentra el reporte solicitado.",
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Reporte de Membresías</h2>
            <p>Adjunto se encuentra el reporte solicitado.</p>
            <hr />
            <p style="font-size: 0.8em; color: #666;">Este es un correo automático, por favor no responda.</p>
          </div>
        `,
        attachments: [{
          filename,
          content: pdf,
          contentType: "application/pdf"
        }]
      });

      return res.json({ success: true, message: "Reporte enviado por correo exitosamente" });
    } catch (error) {
      console.error("Error en sendReportByEmail (membership):", error);
      return res.status(500).json({ success: false, error: error.message || "Error al enviar el reporte" });
    }
  },

  async sendReportByWhatsApp(req, res) {
    let tempPath = null;
    try {
      const { period, date, telefono } = req.body;

      if (!telefono) {
        return res.status(400).json({ success: false, error: "Teléfono requerido" });
      }

      if (!whatsappService.isConnected) {
        return res.status(400).json({
          success: false,
          error: "El servicio de WhatsApp no está vinculado. Abre /whatsapp-qr y escanea el código."
        });
      }

      const { pdf, filename } = await MembershipService.generateReportPDF(period, date);

      tempPath = path.join(os.tmpdir(), `membership_report_${Date.now()}_${filename}`);
      await fs.promises.writeFile(tempPath, pdf);

      const mensaje = `📊 *Reporte de Membresías*\n🗓️ Periodo: ${period}\n🏢 *Hotel Residency Club*`;
      const result = await whatsappService.enviarMensajeConPDF(telefono, mensaje, tempPath, filename);

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error || "Error al enviar por WhatsApp" });
      }

      return res.json({ success: true, message: "Reporte enviado por WhatsApp exitosamente" });
    } catch (error) {
      console.error("Error en sendReportByWhatsApp (membership):", error);
      return res.status(500).json({ success: false, error: error.message || "Error al enviar el reporte" });
    } finally {
      if (tempPath) {
        try {
          await fs.promises.unlink(tempPath);
        } catch {
        }
      }
    }
  },
};

export { reportsController };