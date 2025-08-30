import { modelList } from "../models/modelList.js";

const listMembershipController = {
  // Renderizar la vista de lista de membresías
  async renderMembershipList(req, res) {
    try {
      const userRole = req.session.user?.role || "Recepcionista";
      const isAdmin = userRole === "Administrador";

      // Obtener parámetros de filtro de la query string
      const { filter, search, type, status } = req.query;

      let membresias = [];
      let estadisticas = {};

      // Obtener estadísticas
      estadisticas = await modelList.getEstadisticasMembresias();

      // Aplicar filtros según los parámetros
      if (search) {
        membresias = await modelList.buscarMembresias(search);
      } else if (type) {
        membresias = await modelList.getMembresiasPorTipo(type);
      } else if (status) {
        membresias = await modelList.getMembresiasPorEstado(status);
      } else if (filter === "active" || !filter) {
        // Por defecto mostrar todas las activas
        membresias = await modelList.getMembresiasActivas();
      }

      // Formatear datos para la vista
      // En el método renderMembershipList, modifica el mapeo de membresías:
      const membresiasFormateadas = membresias.map((membresia) => {
        // Calcular si está activa considerando tanto el estado como la fecha
        const diasRestantes = membresia.dias_restantes;
        const estaActiva = membresia.estado === "Activa" && diasRestantes > 0;
        const estaVencida = diasRestantes <= 0;

        // Determinar el estado real
        let estadoReal = "Inactiva";
        if (estaActiva) {
          if (diasRestantes > 20) {
            estadoReal = "Activa";
          } else if (diasRestantes > 7) {
            estadoReal = "Activa_Proxima";
          } else if (diasRestantes > 0) {
            estadoReal = "Por_Vencer";
          }
        } else if (estaVencida) {
          estadoReal = "Vencida";
        }

        return {
          id: membresia.id_activa,
          fullName: membresia.nombre_completo,
          phone: membresia.telefono,
          email: membresia.correo,
          type: membresia.tipo,
          startDate: membresia.fecha_inicio,
          endDate: membresia.fecha_fin,
          status: membresia.estado,
          daysUntilExpiry: diasRestantes,
          members: membresia.integrantes ? membresia.integrantes.length + 1 : 1,
          amount: membresia.precio_final,
          isFamily: membresia.tipo === "Familiar",
          isActive: estaActiva, // ← Esto ahora considera tanto estado como fecha
          isExpired: estaVencida, // ← Nueva propiedad para vencidas
          statusType: estadoReal, // ← Nueva propiedad para el tipo de estado
          integrantes: membresia.integrantes || [],
        };
      });

      res.render("membershipList", {
        title: "Lista de Membresías",
        isAdmin,
        userRole,
        memberships: membresiasFormateadas,
        estadisticas,
        currentFilter: filter || "all",
        currentSearch: search || "",
        currentType: type || "",
        currentStatus: status || "",
      });
    } catch (error) {
      console.error("Error al renderizar lista de membresías:", error);

      // Enviar respuesta JSON si es una solicitud AJAX
      if (req.xhr || req.headers.accept.indexOf("json") > -1) {
        return res.status(500).json({
          success: false,
          message: "Error al cargar la lista de membresías",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Error interno del servidor",
        });
      }

      // Redirigir a una página de error genérica si la vista de error no existe
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 min-h-screen flex items-center justify-center">
          <div class="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
            <div class="text-center">
              <div class="bg-red-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
              </div>
              <h1 class="text-2xl font-bold text-gray-800 mb-2">Error</h1>
              <p class="text-gray-600 mb-6">Error al cargar la lista de membresías</p>
              <a href="/memberships" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                <i class="fas fa-arrow-left mr-2"></i>Volver a Membresías
              </a>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  },

  // API: Obtener membresías (para AJAX)
  async getMembresiasAPI(req, res) {
    try {
      const { filter, search, type, status } = req.query;

      let membresias = [];

      // Aplicar filtros según los parámetros
      if (search) {
        membresias = await modelList.buscarMembresias(search);
      } else if (type) {
        membresias = await modelList.getMembresiasPorTipo(type);
      } else if (status) {
        membresias = await modelList.getMembresiasPorEstado(status);
      } else {
        membresias = await modelList.getMembresiasActivas();
      }

      // Formatear datos para la respuesta JSON
      const membresiasFormateadas = membresias.map((membresia) => {
        const formatDate = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        };
        return {
          id: membresia.id_activa,
          fullName: membresia.nombre_completo,
          phone: membresia.telefono,
          email: membresia.correo,
          type: membresia.tipo,
          startDate: formatDate(membresia.fecha_inicio),
          endDate: formatDate(membresia.fecha_fin),
          status: membresia.estado,
          daysUntilExpiry: membresia.dias_restantes,
          members: membresia.integrantes ? membresia.integrantes.length + 1 : 1,
          amount: membresia.precio_final,
          isFamily: membresia.tipo === "Familiar",
          integrantes: membresia.integrantes || [],
        };
      });

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
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Error interno del servidor",
      });
    }
  },

  // API: Obtener estadísticas (para AJAX)
  async getEstadisticasAPI(req, res) {
    try {
      const estadisticas = await modelList.getEstadisticasMembresias();

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error) {
      console.error("Error en API de estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las estadísticas",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Error interno del servidor",
      });
    }
  },
};

export { listMembershipController };
