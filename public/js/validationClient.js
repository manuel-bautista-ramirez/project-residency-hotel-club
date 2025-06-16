// Expresión regular para validar la contraseña
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

// Expresión regular para validar el nombre de usuario (solo letras y números, mínimo 4 caracteres)
const usernameRegex = /^[A-Za-z\d]{6,10}$/;

// Seleccionar los campos de usuario y contraseña
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Validar el campo de usuario
usernameInput.addEventListener('input', () => {
  console.log('Validating username:', usernameInput.value);
  if (usernameRegex.test(usernameInput.value)) {
    usernameInput.classList.add('border-green-500');
    usernameInput.classList.remove('border-red-500');
  } else {
    usernameInput.classList.remove('border-green-500');
    usernameInput.classList.add('border-red-500');
  }
});

// Validar el campo de contraseña
passwordInput.addEventListener('input', () => {
  if (passwordRegex.test(passwordInput.value)) {
    passwordInput.classList.add('border-green-500');
    passwordInput.classList.remove('border-red-500');
  } else {
    passwordInput.classList.remove('border-green-500');
    passwordInput.classList.add('border-red-500');
  }
});
