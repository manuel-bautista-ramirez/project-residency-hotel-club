// Expresiones regulares para validaciones
export const regex = {
  emptyField: /^\s*$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_]{6,10}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
};

// Función genérica de validación
const validate = (type, value, msgErr, msgOk) =>
  regex[type].test(value)
    ? { status: true, message: msgOk }
    : { status: false, message: msgErr };

// Validar campos vacíos (array)
export const validateEmptyFields = values => {
  const invalidFields = values.filter(val => regex.emptyField.test(val));
  return invalidFields.length
    ? { status: false, message: "Algunos campos no pueden estar vacíos.", invalidFields }
    : { status: true, message: "Todos los campos son válidos." };
};

// Validaciones específicas reutilizando la función genérica
export const validateEmail = email =>
  validate('email', email, "El correo electrónico no es válido.", "Correo electrónico válido.");

export const validateUsername = username =>
  validate(
    'username',
    username,
    "El nombre de usuario debe tener entre 6 y 10 caracteres y solo puede contener letras, números y guiones bajos.",
    "Nombre de usuario válido."
  );

export const validatePassword = password =>
  validate(
    'password',
    password,
    "La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra y un número.",
    "Contraseña válida."
  );