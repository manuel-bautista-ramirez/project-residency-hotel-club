/**
 * @file deleteMemberController.js
 * @description Controlador para gestionar la eliminación de membresías.
 * @module controllers/deleteMemberController
 */

import { MembershipService } from "../services/membershipService.js";

/**
 * Objeto controlador para las operaciones de eliminación de membresías.
 * @type {object}
 */
export const deleteMemberController = {
  /**
   * Maneja la solicitud HTTP para eliminar una membresía por su ID.
   * @async
   * @param {import('express').Request} req - El objeto de solicitud de Express. Se espera que `req.params.id` contenga el ID de la membresía a eliminar.
   * @param {import('express').Response} res - El objeto de respuesta de Express.
   * @returns {Promise<void>} Una promesa que se resuelve cuando se ha enviado la respuesta.
   */
  async deleteMembership(req, res) {
    try {
      // Extrae el ID de la membresía de los parámetros de la ruta (ej: /memberships/123)
      const { id } = req.params;
      // Llama al servicio para ejecutar la lógica de negocio de eliminación
      const result = await MembershipService.deleteMembership(id);

      // Responde con un JSON indicando el éxito de la operación
      res.json({
        success: true,
        message: "Membresía eliminada correctamente",
        affectedRows: result.affectedRows,
      });
    } catch (error) {
      // En caso de error, lo registra en la consola para depuración
      console.error("Error deleting membership:", error);
      // Determina el código de estado HTTP, usando el del error si existe, o 500 por defecto
      const statusCode = error.statusCode || 500;
      // Envía una respuesta de error en formato JSON
      res.status(statusCode).json({
        success: false,
        error: error.message || "Error al eliminar la membresía",
      });
    }
  },
};