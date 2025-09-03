import { MembershipModel } from "../models/modelMembership.js";

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
  });
};

//Controlador para renderizar la vista de crear membresía
export const renderMembershipCreate = async (req, res) => {
  try {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";

    // Obtener los datos necesarios
    const tiposMembresia = await MembershipModel.getTiposMembresia();
    const tiposPago = await MembershipModel.getMetodosPago();

    res.render("membershipCreate", {
      title: "Crear Membresía",
      isAdmin,
      userRole,
      tiposMembresia,
      tiposPago,
    });
  } catch (error) {
    console.error("Error al cargar la página de creación de membresía:", error);
    res.status(500).send("Error al cargar la página");
  }
};
