import express from "express";
import { roleMiddleware, authMiddleware } from "../middlewares/accessDenied.js";
import {
  loginUser,
  sendPasswordResetLink,
  resetPassword,
  renderResetPasswordForm
} from "../controllers/authControllerUsers.js";

const router = express.Router();

// =====================
// Rutas de recuperación (PÚBLICAS, sin authMiddleware)
// =====================

// Formulario para pedir recuperación
router.get("/password-reset/request", (req, res) =>
  res.render("requestPassword")
);

// Generar enlace de recuperación
router.post("/password-reset/request", sendPasswordResetLink);

// Mostrar formulario de reset (popup con token)
router.get("/password-reset/reset/:token", renderResetPasswordForm);

// Procesar nueva contraseña
router.post("/password-reset/reset/:token", resetPassword);

// =====================
// Rutas de login/logout (PÚBLICAS)
// =====================
router.get("/login", (req, res) =>
  res.render("login", {
    layout: "main",
    title: "Inicio"
  })
);

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
  });
});

router.get("/services", roleMiddleware("Administrador"), (req, res) => {
  res.send("<h1>Panel de Servicios - Gestión de comunicaciones con clientes (correo, WhatsApp)</h1>");
});

router.get("/admin", roleMiddleware("Administrador"), (req, res) => {
  res.send(
    "<h1>Panel de Administración</h1>");
});




export default router;
