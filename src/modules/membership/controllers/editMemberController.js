import { MembershipService } from "../services/membershipService.js";

export const editMemberController = {
  // GET: Renderiza el formulario de edición
  async editMembership(req, res) {
    try {
      const { id } = req.params;
      const membresia = await MembershipService.getMembershipForEdit(id);
      res.render('editMembership', { membership: membresia });
    } catch (error) {
      console.error("Error obteniendo membresía para editar:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || "Error del servidor" });
    }
  },

  // POST: Actualiza la membresía
  async updateMembership(req, res) {
    try {
      const { id } = req.params;
      await MembershipService.updateCompleteMembership(id, req.body);
      res.redirect("/memberships/listMembership?success=Membresía actualizada correctamente");
    } catch (error) {
      console.error("Error updating membership:", error);
      res.redirect(`/memberships/listMembership?error=${encodeURIComponent(error.message)}`);
    }
  },

  // DELETE: Elimina la membresía
  async deleteMembership(req, res) {
    try {
        const { id } = req.params;
        await MembershipService.deleteMembership(id);
        res.json({ success: true, message: 'Membresía eliminada correctamente' });
    } catch (error) {
        console.error('Error deleting membership:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message || 'Error al eliminar la membresía' });
    }
  },

  // POST: Renueva la membresía (ya estaba bien, se mantiene con mejor manejo de errores)
  async renewMembership(req, res) {
    try {
      const { id } = req.params;
      await MembershipService.renewMembership(id, req.body);
      res.redirect("/memberships/listMembership?success=Membresía renovada correctamente");
    } catch (error) {
      console.error("Error renewing membership:", error);
      res.redirect(`/memberships/listMembership?error=${encodeURIComponent(error.message)}`);
    }
  }
};