import express from "express";
import { roleMiddleware, authMiddleware } from "../middlewares/accessDenied.js";
import {
  loginUser,
  sendPasswordResetLink,
  resetPassword,
} from "../controllers/authControllerUsers.js";

const router = express.Router();

router
  .route("/password-reset/request")
  .get((req, res) => res.render("requestPassword")) // Mostrar formulario
  .post(sendPasswordResetLink); // Enviar enlace

// Restablecer contraseña
router
  .route("/password-reset/reset/:token")
  .get((req, res) => res.render("resetPassword", { token: req.params.token })) // Mostrar formulario
  .post(resetPassword);

// Login page - ruta específica
router.get("/login", (req, res) => res.render("login", {
  layout: "main",
  title: "Inicio",
  showFooter : false
}));

// Handle login
router.post("/login", loginUser);

// Ruta raíz - redirige según autenticación
router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/home");
  }
  res.redirect("/login");
});

// Protected home page
router.get("/home", authMiddleware, (req, res) => {
  const user = req.session.user;
  if (!user?.username || !user?.role) return res.redirect("/login");
  res.render("home", {
    title: "Home",
    showFooter: true,
    ...user });
});

// Logout
router.get("/logout", (req, res) =>
  req.session.destroy((err) =>
    err ? res.status(500).send("Error al cerrar sesión") : res.redirect("/")
  )
);

// Admin panel de prueba (HTML directo)
router.get("/admin", roleMiddleware("Administrador"), (req, res) => {
  res.send("<h1>Panel de Administración</h1>");
});

export default router;
