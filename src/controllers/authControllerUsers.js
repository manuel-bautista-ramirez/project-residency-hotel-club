import { findUserByUsername, verifyPassword } from '../models/userModel.js';
import { validateEmptyFields, validateUsername, validatePassword } from '../middlewares/validation/textBox.js';


export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Validar campos vacíos
  const emptyFieldsValidation = validateEmptyFields([username, password]);
  if (!emptyFieldsValidation.status) {
    return res.status(400).render('login', {
      title: 'Inicio',
      error: emptyFieldsValidation.message,
    });
  }

  // Validar nombre de usuario
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.status) {
    return res.status(400).render('login', {
      title: 'Inicio',
      error: usernameValidation.message,
    });
  }

  // Validar contraseña
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.status) {
    return res.status(400).render('login', {
      title: 'Inicio',
      error: passwordValidation.message,
    });
  }

  // Buscar el usuario en el modelo
  const user = await findUserByUsername(username);

  if (!user) {
    return res.status(401).render('login', {
      title: 'Inicio',
      error: 'Usuario no encontrado.',
    });
  }

  // Verificar la contraseña
  const isPasswordValid = await verifyPassword(password, user.password);
  if (isPasswordValid) {
    // Guardar el usuario en la sesión con su tipo
    req.session.user = {
      username: user.username,
      role: user.role,
    };
    console.log(`El usuario (${user.username}) con el rol correspondiente:(${user.role}) ha iniciado sesión correctamente.`);
    res.redirect('/home'); // Redirigir al panel de inicio
  } else {
    // Credenciales incorrectas
    res.status(401).render('login', {
      title: 'Inicio',
      error: 'Credenciales incorrectas.',
    });
  }
};
