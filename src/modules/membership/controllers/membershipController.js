import { MembershipService } from "../services/membershipService.js";

// Controlador para renderizar la vista principal
export const renderMembershipHome = (req, res) => {
  const userRole = req.session.user?.role || "Recepcionista";
  const isAdmin = userRole === "Administrador";

  res.render("membershipHome", {
    title: "Área de Membresías",
    isAdmin,
    userRole,
  });
};

// Controlador para renderizar la vista de listar membresías
export const renderMembershipList = (req, res) => {
  const userRole = req.session.user?.role || "Recepcionista";
  const isAdmin = userRole === "Administrador";

  res.render("membershipList", {
    title: "Lista de Membresías",
    isAdmin,
    userRole,
    apiBase: "/memberships",
    apiIntegrantes: "/memberships/:id_activa/integrantes",
  });
};

// Controlador para renderizar la vista de crear membresía
export const renderMembershipCreate = async (req, res) => {
  try {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";
    const pageData = await MembershipService.getDataForCreatePage();

    res.render("membershipCreate", {
      title: "Crear Membresía",
      isAdmin,
      userRole,
      ...pageData,
    });
  } catch (error) {
    console.error("Error al cargar la página de creación de membresía:", error);
    res.status(500).render('error', {
        title: "Error",
        message: "Error al cargar la página de creación de membresía."
    });
  }
};

// Controlador para renderizar la vista de renovación de membresía
export const renderRenewMembership = async (req, res) => {
  try {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";
    const { id } = req.params;
    const pageData = await MembershipService.getDataForRenewPage(id);

    res.render("renewalMembership", {
      title: "Renovar Membresía",
      isAdmin,
      userRole,
      membership: pageData.membresia,
      tiposMembresia: pageData.tiposMembresia,
      tiposPago: pageData.tiposPago,
      helpers: {
        formatDate: (date) => {
          if (!date) return '';
          const d = new Date(date);
          return d.toISOString().split('T')[0];
        },
        eq: (a, b) => a === b,
        now: () => new Date(),
        json: (context) => JSON.stringify(context),
      }
    });
  } catch (error) {
    console.error("Error al cargar la página de renovación de membresía:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).render('error', {
        title: "Error",
        message: error.message || "Error al cargar la página de renovación."
    });
  }
}

// Controlador para renderizar la vista de edición de membresía
export const renderEditMembership = async (req, res) => {
  try {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";
    const { id } = req.params;
    const pageData = await MembershipService.getDataForEditPage(id);

    res.render("editMembership", {
      title: "Editar Membresía",
      isAdmin,
      userRole,
      membership: pageData.membresia,
      tiposMembresia: pageData.tiposMembresia,
      helpers: {
        formatDate: (date) => {
          if (!date) return '';
          const d = new Date(date);
          return d.toISOString().split('T')[0];
        },
        eq: (a, b) => a === b
      }
    });
  } catch (error) {
    console.error("Error al cargar la página de edición de membresía:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).render('error', {
        title: "Error",
        message: error.message || "Error al cargar la página de edición."
    });
  }
};