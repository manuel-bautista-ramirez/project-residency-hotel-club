import { MembershipService } from "../services/membershipService.js";

export const deleteMemberController = {
  async deleteMembership(req, res) {
    try {
      const { id } = req.params;
      const result = await MembershipService.deleteMembership(id);

      res.json({
        success: true,
        message: "Membresía eliminada correctamente",
        affectedRows: result.affectedRows,
      });
    } catch (error) {
      console.error("Error deleting membership:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || "Error al eliminar la membresía",
      });
    }
  },
};