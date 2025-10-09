import crypto from "crypto";
import {
  findUserByUsername,
  verifyPassword,
  updateUserPassword,
  savePasswordResetToken,
  getPasswordResetToken,
  deletePasswordResetToken,
} from "../models/userModel.js";
import {
  validateEmptyFields,
  validateUsername,
  validatePassword,
} from "../middlewares/validation/textBox.js";

// 🌟 Generar enlace de recuperación
export const sendPasswordResetLink = async (req, res) => {
  const { username } = req.body;

  try {
    // Buscar usuario por nombre
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).render("requestPassword", { error: "Usuario no encontrado" });
    }

    // Crear token y expiración (1 hora)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000);

    // Guardar token en la tabla password_resets
    await savePasswordResetToken(user.id, token, expiresAt);

    // Crear enlace de recuperación
    const resetLink = `http://localhost:3000/password-reset/reset/${token}`;

    // Mostrar enlace en la interfaz y en consola
    res.render("requestPassword", { success: `${resetLink}` });
    console.log(`Enlace de recuperación generado: ${resetLink}`);
  } catch (error) {
    console.error("Error al generar enlace de recuperación:", error);
    res.status(500).send("Error en el servidor");
  }
};

// 🌟 Restablecer contraseña usando token
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Buscar token en la DB
    const resetToken = await getPasswordResetToken(token);

    if (!resetToken || new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).render("resetPassword", { error: "El token es inválido o ha expirado." });
    }

    // Actualizar contraseña usando el modelo (updateUserPassword hace el hash)
    await updateUserPassword(resetToken.user_id, password);

    // Eliminar token usado
    await deletePasswordResetToken(token);

    res.render("resetPassword", { success: "Contraseña restablecida correctamente." });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).send("Error en el servidor");
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Validar campos vacíos
  const emptyFieldsValidation = validateEmptyFields([username, password]);
  if (!emptyFieldsValidation.status) {
    return res.status(400).render("login", {
      title: "Inicio",
      error: emptyFieldsValidation.message,
    });
  }

  // Validar nombre de usuario
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.status) {
    return res.status(400).render("login", {
      title: "Inicio",
      error: usernameValidation.message,
    });
  }

  // Validar contraseña
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.status) {
    return res.status(400).render("login", {
      title: "Inicio",
      error: passwordValidation.message,
    });
  }

  // Buscar el usuario en el modelo
  const user = await findUserByUsername(username);

  if (!user) {
    return res.status(401).render("login", {
      title: "Inicio",
      error: "Usuario no encontrado.",
    });
  }

  // Verificar la contraseña
  const isPasswordValid = await verifyPassword(password, user.password);
  if (isPasswordValid) {
    // Guardar el usuario en la sesión con su tipo
    req.session.user = {
      // id: user.id,                // <- importante
      username: user.username,
      role: user.role,
    };
    console.log(
      `El usuario (${user.username}) con el rol correspondiente:(${user.role}) ha iniciado sesión correctamente.`
    );
    res.redirect("/home"); // Redirigir al panel de inicio
  } else {
    // Credenciales incorrectas
    res.status(401).render("login", {
      title: "Inicio",
      error: "Credenciales incorrectas.",
    });
  }
};
