import express from "express";
import { roleMiddleware, authMiddleware } from "../../../middlewares/validation/accessDenied.js";
import {
  loginUser,
  sendPasswordResetCode,
  verifyResetCode,
  resetPasswordWithCode
} from "../controllers/authControllerUsers.js";

const router = express.Router();

// =====================
// Rutas de recuperación por EMAIL (PÚBLICAS, sin authMiddleware)
// =====================

// Formulario para pedir recuperación por email
router.get("/password-reset/request", (req, res) =>
  res.render("requestPasswordEmail", {
    layout: "main",
    disablePageLoadingOverlay: true
  })
);

// Enviar código de recuperación por email
router.post("/password-reset/request", sendPasswordResetCode);

// Verificar código de recuperación
router.post("/password-reset/verify-code", verifyResetCode);

// Procesar nueva contraseña con código
router.post("/password-reset/reset", resetPasswordWithCode);

// =====================
// Rutas de login/logout (PÚBLICAS)
// =====================
router.get("/login", (req, res) => {
  // Si el usuario ya tiene una sesión, redirigirlo a la página principal
  if (req.session.user) {
    return res.redirect('/rooms');
  }
  
  // Verificar si hay mensajes especiales
  let message = null;
  if (req.query.message === 'account_deleted') {
    message = 'Tu cuenta ha sido eliminada por un administrador.';
  } else if (req.query.message === 'admin_revoked') {
    message = 'Tus privilegios de administrador han sido revocados.';
  }
  
  // Si no, mostrar la página de login
  res.render("login", {
    layout: "main",
    title: "Inicio",
    message,
    disablePageLoadingOverlay: true
  });
});

router.post("/login", loginUser);

router.get("/logout", (req, res) =>
  req.session.destroy((err) =>
    err ? res.status(500).send("Error al cerrar sesión") : res.redirect("/")
  )
);

// =====================
// Rutas privadas (con authMiddleware)
// =====================
router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/home");
  }
  res.redirect("/login");
});

router.get("/home", authMiddleware, (req, res) => {
  const user = req.session.user;
  if (!user?.username || !user?.role) return res.redirect("/login");
  res.render("home", {
    title: "Home",
    showFooter: true,
    ...user,
    showNavbar: true
  });
});

// Ruta /admin movida al módulo admin para funcionalidad completa
// router.get("/admin", authMiddleware, (req, res) => {
//   res.render("homeAdmintration", {
//     title: "Administracion",
//     showFooter: true,
//     showNavbar: true
//   });
// });

export default router;
