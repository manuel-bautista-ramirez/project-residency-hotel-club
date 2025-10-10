/**
 * @file editMemberController.js
 * @description Controlador para la edición, actualización, renovación y eliminación de membresías.
 * @module controllers/editMemberController
 */

import { MembershipService } from "../services/membershipService.js";

/**
 * Objeto controlador para las operaciones de modificación de membresías.
 * @type {object}
 */
export const editMemberController = {
  /**
   * Renderiza el formulario de edición para una membresía específica.
   * @deprecated Este método parece ser una versión simplificada. Se recomienda usar `renderEditMembership` del `membershipController` que carga todos los datos necesarios.
   * @async
   * @param {import('express').Request} req - El objeto de solicitud de Express. Se espera `id` en `req.params`.
   * @param {import('express').Response} res - El objeto de respuesta de Express.
   */
  async editMembership(req, res) {
    try {
      const { id } = req.params;
      const membresia = await MembershipService.getMembershipForEdit(id);
      res.render('editMembership', { membership: membresia });
    } catch (error) {
      // Nota: Este controlador devuelve JSON en caso de error, lo cual es inconsistente
      // para un método que se supone que renderiza una vista. Debería renderizar una página de error.
      console.error("Error obteniendo membresía para editar:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || "Error del servidor" });
    }
  },

  /**
   * Procesa la actualización de los datos de una membresía.
   * @async
   * @param {import('express').Request} req - El objeto de solicitud de Express. Se espera `id` en `req.params` y los datos a actualizar en `req.body`.
   * @param {import('express').Response} res - El objeto de respuesta de Express.
   */
  async updateMembership(req, res) {
    try {
      const { id } = req.params;
      await MembershipService.updateCompleteMembership(id, req.body);
      // Redirige a la lista de membresías con un mensaje de éxito en la URL.
      res.redirect("/memberships/listMembership?success=Membresía actualizada correctamente");
    } catch (error) {
      console.error("Error updating membership:", error);
      // Redirige a la lista con un mensaje de error en la URL.
      res.redirect(`/memberships/listMembership?error=${encodeURIComponent(error.message)}`);
    }
  },

  /**
   * Maneja la eliminación de una membresía (endpoint de API).
   * @async
   * @param {import('express').Request} req - El objeto de solicitud de Express. Se espera `id` en `req.params`.
   * @param {import('express').Response} res - El objeto de respuesta de Express.
   */
  async deleteMembership(req, res) {
    try {
        const { id } = req.params;
        await MembershipService.deleteMembership(id);
        // Responde con JSON para confirmar la eliminación (ideal para llamadas AJAX/Fetch).
        res.json({ success: true, message: 'Membresía eliminada correctamente' });
    } catch (error) {
        console.error('Error deleting membership:', error);
        const statusCode = error.statusCode || 500;
        // Responde con un error en formato JSON.
        res.status(statusCode).json({ error: error.message || 'Error al eliminar la membresía' });
    }
  },
  /**
   * Procesa la renovación de una membresía.
   * @async
   * @param {import('express').Request} req - El objeto de solicitud de Express. Se espera `id` de la membresía antigua en `req.params` y los datos de la nueva en `req.body`.
   * @param {import('express').Response} res - El objeto de respuesta de Express.
   */
  async renewMembership(req, res) {
    try {
      const { id } = req.params;
      await MembershipService.renewMembership(id, req.body);
      // Redirige a la lista con un mensaje de éxito.
      res.redirect("/memberships/listMembership?success=Membresía renovada correctamente");
    } catch (error) {
      console.error("Error renewing membership:", error);
      // Redirige a la lista con un mensaje de error.
      res.redirect(`/memberships/listMembership?error=${encodeURIComponent(error.message)}`);
    }
  }
};