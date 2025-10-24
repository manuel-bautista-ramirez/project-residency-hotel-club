/**
 * @file membershipController.js
 * @description Controladores dedicados a renderizar las diferentes vistas (páginas) del módulo de membresías.
 * @module controllers/membershipController
 */

import { MembershipService } from "../services/membershipService.js";

/**
 * Renderiza la página principal (home) del área de membresías.
 * @param {import('express').Request} req - El objeto de solicitud de Express.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 */
export const renderMembershipHome = (req, res) => {
  // Obtiene el rol del usuario de la sesión para controlar el acceso en la vista.
  const userRole = req.session.user?.role || "Recepcionista";
  const isAdmin = userRole === "Administrador";

  // Renderiza la plantilla 'membershipHome' con los datos necesarios.
  res.render("membershipHome", {
    title: "Área de Membresías",
    isAdmin,
    userRole,
  });
};

/**
 * Renderiza la página que contendrá la lista de membresías.
 * Nota: La data se carga dinámicamente desde el frontend a través de una API.
 * @param {import('express').Request} req - El objeto de solicitud de Express.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 */
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

/**
 * Renderiza el formulario para crear una nueva membresía.
 * Carga previamente los datos necesarios (tipos de membresía, métodos de pago) desde el servicio.
 * @async
 * @param {import('express').Request} req - El objeto de solicitud de Express.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 */
export const renderMembershipCreate = async (req, res) => {
  try {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";
    // Llama al servicio para obtener los datos necesarios para los selectores del formulario.
    const pageData = await MembershipService.getDataForCreatePage();

    res.render("membershipCreate", {
      title: "Crear Membresía",
      isAdmin,
      userRole,
      ...pageData,
    });
  } catch (error) {
    // En caso de error al obtener los datos, renderiza una página de error.
    console.error("Error al cargar la página de creación de membresía:", error);
    res.status(500).render('error', {
        title: "Error",
        message: "Error al cargar la página de creación de membresía."
    });
  }
};

/**
 * Renderiza el formulario para renovar una membresía existente.
 * Carga los datos de la membresía a renovar y los catálogos necesarios.
 * @async
 * @param {import('express').Request} req - El objeto de solicitud de Express. Se espera `id` en `req.params`.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 */
export const renderRenewMembership = async (req, res) => {
  try {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";
    const { id } = req.params;
    // Obtiene los datos de la membresía específica y los catálogos para el formulario.
    const pageData = await MembershipService.getDataForRenewPage(id);

    res.render("renewalMembership", {
      title: "Renovar Membresía",
      isAdmin,
      userRole,
      membership: pageData.membresia,
      tiposMembresia: pageData.tiposMembresia,
      tiposPago: pageData.tiposPago,
      // Helpers de Handlebars específicos para esta vista.
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
    // Si la membresía no se encuentra (404) o hay otro error, muestra la página de error.
    const statusCode = error.statusCode || 500;
    res.status(statusCode).render('error', {
        title: "Error",
        message: error.message || "Error al cargar la página de renovación."
    });
  }
}

/**
 * Renderiza el formulario para editar una membresía existente.
 * Carga los datos actuales de la membresía para pre-llenar el formulario.
 * @async
 * @param {import('express').Request} req - El objeto de solicitud de Express. Se espera `id` en `req.params`.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 */
export const renderEditMembership = async (req, res) => {
  try {
    const userRole = req.session.user?.role || "Recepcionista";
    const isAdmin = userRole === "Administrador";
    const { id } = req.params;
    // Obtiene los datos de la membresía a editar.
    const pageData = await MembershipService.getDataForEditPage(id);

    res.render("editMembership", {
      title: "Editar Membresía",
      isAdmin,
      userRole,
      membership: pageData.membresia,
      tiposMembresia: pageData.tiposMembresia,
      // Helpers de Handlebars para formatear datos en la plantilla.
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
    // Maneja errores como "membresía no encontrada" (404) u otros errores del servidor (500).
    const statusCode = error.statusCode || 500;
    res.status(statusCode).render('error', {
        title: "Error",
        message: error.message || "Error al cargar la página de edición."
    });
  }
};

export const renderManageMembership = async (req, res) => {
    try {
        const userRole = req.session.user?.role || "Recepcionista";
        const isAdmin = userRole === "Administrador";
        res.render("manageMembership", {
            title: "Gestionar Membresía",
            isAdmin,
            userRole
        });
    } catch (error) {
        console.error("Error al cargar la página de gestión de membresía:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).render('error', {
            title: "Error",
            message: error.message || "Error al cargar la página de gestión."
        });
    }
};