import { MembershipService } from "../services/membershipService.js";

const listMembershipController = {
  async renderMembershipList(req, res) {
    try {
      const userRole = req.session.user?.role || "Recepcionista";
      const isAdmin = userRole === "Administrador";
      const { filter, search, type, status } = req.query;

      const listData = await MembershipService.getMembershipListData(req.query);

      res.render("membershipList", {
        title: "Lista de Membresías",
        isAdmin,
        userRole,
        memberships: listData.memberships,
        estadisticas: listData.estadisticas,
        currentFilter: filter || "all",
        currentSearch: search || "",
        currentType: type || "",
        currentStatus: status || "",
        helpers: {
          eq: (a, b) => a === b,
        }
      });
    } catch (error) {
      console.error("Error al renderizar lista de membresías:", error);
      res.status(500).render('error', {
        title: "Error",
        message: "Error al cargar la lista de membresías."
      });
    }
  },

  async getMembresiasAPI(req, res) {
    try {
      const membresiasFormateadas = await MembershipService.getFormattedMembresiasAPI(req.query);
      res.json({
        success: true,
        data: membresiasFormateadas,
        total: membresiasFormateadas.length,
      });
    } catch (error) {
      console.error("Error en API de membresías:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las membresías",
        error: error.message,
      });
    }
  },

  async getEstadisticasAPI(req, res) {
    try {
      const estadisticas = await MembershipService.getEstadisticas();
      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error) {
      console.error("Error en API de estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las estadísticas",
        error: error.message,
      });
    }
  },

  async getIntegrantesAPI(req, res) {
    try {
      const { id_activa } = req.params;
      const integrantes = await MembershipService.getIntegrantes(id_activa);
      res.json(integrantes);
    } catch (error) {
      console.error("Error al obtener integrantes:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        error: error.message || "Error interno del servidor al obtener integrantes",
      });
    }
  },

  async getMembershipDetailsAPI(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.session.user?.role || "Recepcionista";
      const isAdmin = userRole === "Administrador";

      const details = await MembershipService.getMembershipDetailsForAPI(id);

      res.json({
        ...details,
        isAdmin,
      });
    } catch (error) {
      console.error("Error al obtener los detalles de la membresía:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        error: error.message || "Error interno del servidor al obtener los detalles de la membresía",
      });
    }
  },
};

export { listMembershipController };