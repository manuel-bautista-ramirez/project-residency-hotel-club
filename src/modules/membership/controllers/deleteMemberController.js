// En tu controlador
import { deleteMembershipById } from "../models/modelDelete.js";

export const deleteMemberController = {
  async deleteMembership(req, res) {
    try {
      const { id } = req.params;

      const result = await deleteMembershipById(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Membresía no encontrada",
        });
      }

      res.json({
        success: true,
        message: "Membresía eliminada correctamente",
        affectedRows: result.affectedRows,
      });
    } catch (error) {
      console.error("Error deleting membership:", error);
      res.status(500).json({
        success: false,
        error: "Error al eliminar la membresía",
        details: error.message,
      });
    }
  },
};
