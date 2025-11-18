// Regular expressions for validation (migrated from server-side)
const regex = {
  emptyField: /^\s*$/, // Matches empty or whitespace-only fields
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Matches valid email formats
  username: /^[a-zA-Z0-9_]{6,10}$/, // Matches usernames (6-10 characters, alphanumeric, underscores)
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, // Matches passwords (min 8 characters, at least 1 letter and 1 number)
};

// Validation functions (migrated from server-side)
const validateEmptyFields = (values) => {
  const invalidFields = values.filter(value => regex.emptyField.test(value));
  if (invalidFields.length > 0) {
    return { status: false, message: "Algunos campos no pueden estar vacíos.", invalidFields };
  }
  return { status: true, message: "Todos los campos son válidos." };
};

const validateEmail = (email) => {
  if (!regex.email.test(email)) {
    return { status: false, message: "El correo electrónico no es válido." };
  }
  return { status: true, message: "Correo electrónico válido." };
};

const validateUsername = (username) => {
  if (!regex.username.test(username)) {
    return { status: false, message: "El nombre de usuario debe tener entre 6 y 10 caracteres y solo puede contener letras, números y guiones bajos." };
  }
  return { status: true, message: "Nombre de usuario válido." };
};

const validatePassword = (password) => {
  if (!regex.password.test(password)) {
    return { status: false, message: "La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra y un número." };
  }
  return { status: true, message: "Contraseña válida." };
};

// UI Helper functions
const applyValidationStyles = (element, isValid) => {
  if (isValid) {
    element.classList.add('border-green-500');
    element.classList.remove('border-red-500');
  } else {
    element.classList.remove('border-green-500');
    element.classList.add('border-red-500');
  }
};

const showValidationMessage = (elementId, message, isValid) => {
  const messageElement = document.getElementById(`${elementId}-message`);
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.className = isValid ? 'text-green-600 text-sm' : 'text-red-600 text-sm';
  }
};

// DOM Elements
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const emailInput = document.getElementById('email');

// Real-time validation for username
if (usernameInput) {
  usernameInput.addEventListener('input', () => {
    const validation = validateUsername(usernameInput.value);
    applyValidationStyles(usernameInput, validation.status);
    showValidationMessage('username', validation.message, validation.status);
  });
}

// Real-time validation for password
if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    const validation = validatePassword(passwordInput.value);
    applyValidationStyles(passwordInput, validation.status);
    showValidationMessage('password', validation.message, validation.status);
  });
}

// Real-time validation for email
if (emailInput) {
  emailInput.addEventListener('input', () => {
    const validation = validateEmail(emailInput.value);
    applyValidationStyles(emailInput, validation.status);
    showValidationMessage('email', validation.message, validation.status);
  });
}

// Form validation function
const validateForm = (formData) => {
  const results = [];
  
  // Validate empty fields
  const values = Object.values(formData);
  const emptyValidation = validateEmptyFields(values);
  if (!emptyValidation.status) {
    results.push(emptyValidation);
  }
  
  // Validate specific fields
  if (formData.username) {
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.status) {
      results.push(usernameValidation);
    }
  }
  
  if (formData.password) {
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.status) {
      results.push(passwordValidation);
    }
  }
  
  if (formData.email) {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.status) {
      results.push(emailValidation);
    }
  }
  
  return {
    isValid: results.length === 0,
    errors: results
  };
};

// Export functions for use in other modules
window.ValidationClient = {
  regex,
  validateEmptyFields,
  validateEmail,
  validateUsername,
  validatePassword,
  validateForm,
  applyValidationStyles,
  showValidationMessage
};
