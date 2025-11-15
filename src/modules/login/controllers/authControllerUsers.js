import crypto from "crypto";
import {
  findUserByUsername,
  findUserByEmail,
  verifyPassword,
  updateUserPassword,
  savePasswordResetCode,
  getPasswordResetCode,
  deletePasswordResetCode,
} from "../models/userModel.js";
import emailService from "../../../services/emailService.js";
import {
  validateEmptyFields,
  validateEmail,
  validateUsername,
  validatePassword,
} from "../../../middlewares/validation/textBox.js";

// Generar código de recuperación y enviarlo por email
export const sendPasswordResetCode = async (req, res) => {
  const { email } = req.body;

  try {
    // Validar que el email no esté vacío
    const emptyFieldsValidation = validateEmptyFields([email]);
    if (!emptyFieldsValidation.status) {
      return res.render("requestPasswordEmail", { error: "El correo electrónico es requerido" });
    }

    // Validar formato del email
    const emailValidation = validateEmail(email);
    if (!emailValidation.status) {
      return res.render("requestPasswordEmail", { error: emailValidation.message });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).render("requestPasswordEmail", { error: "No se encontró una cuenta con ese correo electrónico" });
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 900000); // 15 minutos

    await savePasswordResetCode(user.id, code, expiresAt);

    // Enviar código por email
    const emailOptions = {
      to: email,
      subject: "Código de recuperación de contraseña - Hotel Club",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Recuperación de contraseña</h2>
          <p>Hola <strong>${user.username}</strong>,</p>
          <p>Has solicitado restablecer tu contraseña. Tu código de verificación es:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
          </div>
          <p><strong>Este código expira en 15 minutos.</strong></p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">Hotel Club - Sistema de gestión</p>
        </div>
      `
    };

    await emailService.send(emailOptions);

    res.render("requestPasswordEmail", { 
      success: "Código enviado correctamente a tu correo electrónico",
      email: email,
      showCodeForm: true
    });

    console.log(`Código de recuperación enviado a ${email}: ${code}`);
  } catch (error) {
    console.error("Error al enviar código de recuperación:", error);
    res.status(500).render("requestPasswordEmail", { error: "Error al enviar el código. Inténtalo de nuevo." });
  }
};

// Verificar código de recuperación
export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const resetCode = await getPasswordResetCode(code);
    
    if (!resetCode || new Date(resetCode.expires_at) < new Date()) {
      return res.render("requestPasswordEmail", { 
        error: "El código es inválido o ha expirado.",
        email: email,
        showCodeForm: true
      });
    }

    // Verificar que el código pertenece al usuario del email
    const user = await findUserByEmail(email);
    if (!user || user.id !== resetCode.user_id) {
      return res.render("requestPasswordEmail", { 
        error: "Código inválido para este correo.",
        email: email,
        showCodeForm: true
      });
    }

    // Código válido, mostrar formulario de nueva contraseña
    res.render("resetPasswordNew", { code, email });
  } catch (error) {
    console.error("Error al verificar código:", error);
    res.status(500).render("requestPasswordEmail", { 
      error: "Error en el servidor. Inténtalo de nuevo.",
      email: email,
      showCodeForm: true
    });
  }
};

// Restablecer contraseña usando código
export const resetPasswordWithCode = async (req, res) => {
  const { code, email, password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.render("resetPasswordNew", { 
        code, 
        email, 
        error: "Las contraseñas no coinciden." 
      });
    }

    const resetCode = await getPasswordResetCode(code);
    if (!resetCode || new Date(resetCode.expires_at) < new Date()) {
      return res.render("resetPasswordNew", { 
        code, 
        email, 
        error: "El código es inválido o ha expirado." 
      });
    }

    // Verificar que el código pertenece al usuario del email
    const user = await findUserByEmail(email);
    if (!user || user.id !== resetCode.user_id) {
      return res.render("resetPasswordNew", { 
        code, 
        email, 
        error: "Código inválido para este correo." 
      });
    }

    await updateUserPassword(resetCode.user_id, password);
    await deletePasswordResetCode(code);

    // Redirigir al login con mensaje de éxito
    res.render("login", { 
      layout: "main",
      title: "Inicio",
      success: "Contraseña restablecida correctamente. Ya puedes iniciar sesión."
    });

    console.log(`Contraseña restablecida para usuario: ${user.username}`);
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.render("resetPasswordNew", { 
      code, 
      email, 
      error: "Error en el servidor. Inténtalo de nuevo." 
    });
  }
};;


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
    // ✅ Guardar el usuario en la sesión con su id, username y rol
    req.session.user = {
      id: user.id,           // ← agregado
      username: user.username,
      role: user.role,
    };

    console.log(
      `El usuario (${user.username}) [ID:${user.id}] con rol (${user.role}) ha iniciado sesión correctamente.`
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

