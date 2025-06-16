// Regular expressions for validation
export const regex = {
  emptyField: /^\s*$/, // Matches empty or whitespace-only fields
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Matches valid email formats
  username: /^[a-zA-Z0-9_]{6,10}$/, // Matches usernames (3-16 characters, alphanumeric, underscores)
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, // Matches passwords (min 8 characters, at least 1 letter and 1 number)
};

// Validation functions
export const validateEmptyFields = (values) => {
  const invalidFields = values.filter(value => regex.emptyField.test(value));
  if (invalidFields.length > 0) {
    return { status: false, message: "Algunos campos no pueden estar vacíos.", invalidFields };
  }
  return { status: true, message: "Todos los campos son válidos." };
};

export const validateEmail = (email) => {
  if (!regex.email.test(email)) {
    return { status: false, message: "El correo electrónico no es válido." };
  }
  return { status: true, message: "Correo electrónico válido." };
};

export const validateUsername = (username) => {
  if (!regex.username.test(username)) {
    return { status: false, message: "El nombre de usuario debe tener entre 6 y 10 caracteres y solo puede contener letras, números y guiones bajos." };
  }
  return { status: true, message: "Nombre de usuario válido." };
};

export const validatePassword = (password) => {
  if (!regex.password.test(password)) {
    return { status: false, message: "La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra y un número." };
  }
  return { status: true, message: "Contraseña válida." };
};
