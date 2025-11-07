// Crea una función para seleccionar elementos del DOM
const $ = (element) => document.querySelector(element);

// Función para eliminar mensajes de error previos
const clearErrors = () => {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());
};

// Función para validar campos del formulario de renta
const validation = () => {
  clearErrors();

  // Define los campos del formulario y sus reglas de validación
  const fields = {
    // Nombre del cliente - solo letras y espacios
    client_name: {
      element: $("#client_name"),
      regEx: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/,
      message: "El nombre debe contener solo letras y espacios (2-50 caracteres)",
    },
    // Correo electrónico
    email: {
      element: $("#email"),
      regEx: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Ingrese un correo electrónico válido",
    },
    // Teléfono - 10 dígitos
    phone: {
      element: $("#phone"),
      regEx: /^[0-9]{10}$/,
      message: "El teléfono debe tener exactamente 10 dígitos",
    },
    // Fecha de check-in
    check_in: {
      element: $("#check_in"),
      regEx: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      message: "Seleccione una fecha y hora de check-in válida",
      isDateTime: true,
    },
    // Fecha de check-out
    check_out: {
      element: $("#check_out"),
      regEx: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      message: "Seleccione una fecha y hora de check-out válida",
      isDateTime: true,
    },
    // Tipo de pago
    payment_type: {
      element: $("#payment_type"),
      regEx: /^(efectivo|tarjeta|transferencia)$/,
      message: "Seleccione un tipo de pago válido",
      isSelect: true,
    },
    // Precio - número positivo
    price: {
      element: $("#price"),
      regEx: /^(0*[1-9]\d*(\.\d{1,2})?|0*\.\d*[1-9]\d*)$/,
      message: "El precio debe ser un número positivo válido",
    },
  };

  let isValid = true;

  // Recorre cada campo definido para validar
  for (const field in fields) {
    const { element, regEx, message, isDateTime, isSelect } = fields[field];

    if (!element) continue; // Si el elemento no existe, continuar

    // Validar campos vacíos
    if (!element.value.trim()) {
      const error = document.createElement("p");
      error.style.color = "red";
      error.style.fontSize = "12px";
      error.textContent = "Este campo no puede estar vacío";
      error.classList.add("error-message", "error-animation");
      element.insertAdjacentElement("afterend", error);
      isValid = false;
      continue;
    }

    // Validaciones específicas para fechas y horas
    if (isDateTime && element.value) {
      const selectedDateTime = new Date(element.value);
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Inicio del día actual

      if (field === "check_in") {
        // Permitir fechas de hoy en adelante
        const selectedDate = new Date(selectedDateTime);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          const error = document.createElement("p");
          error.style.color = "red";
          error.style.fontSize = "12px";
          error.textContent = "La fecha de check-in no puede ser anterior a hoy";
          error.classList.add("error-message", "error-animation");
          element.insertAdjacentElement("afterend", error);
          isValid = false;
          continue;
        }
      }

      if (field === "check_out") {
        const checkInDateTime = new Date($("#check_in").value);
        if (selectedDateTime <= checkInDateTime) {
          const error = document.createElement("p");
          error.style.color = "red";
          error.style.fontSize = "12px";
          error.textContent = "La fecha de check-out debe ser posterior al check-in";
          error.classList.add("error-message", "error-animation");
          element.insertAdjacentElement("afterend", error);
          isValid = false;
          continue;
        }
      }
    }

    // Validar con expresión regular
    if (element.value && !regEx.test(element.value)) {
      const error = document.createElement("p");
      error.style.color = "blue";
      error.style.fontSize = "12px";
      error.textContent = message;
      error.classList.add("error-message", "error-animation");
      element.insertAdjacentElement("afterend", error);
      isValid = false;
    }
  }

  return isValid;
};

// Validación en tiempo real para campos específicos
const setupRealTimeValidation = () => {
  // Validación de nombre en tiempo real
  const clientNameInput = $("#client_name");
  if (clientNameInput) {
    clientNameInput.addEventListener("input", () => {
      const value = clientNameInput.value;
      const isValid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value);
      
      if (!isValid) {
        clientNameInput.style.borderColor = "red";
      } else {
        clientNameInput.style.borderColor = "";
      }
    });
  }

  // Validación de teléfono en tiempo real
  const phoneInput = $("#phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      // Solo permitir números
      phoneInput.value = phoneInput.value.replace(/[^0-9]/g, "");
      
      // Limitar a 10 dígitos
      if (phoneInput.value.length > 10) {
        phoneInput.value = phoneInput.value.slice(0, 10);
      }
    });
  }

  // Validación de precio en tiempo real
  const priceInput = $("#price");
  if (priceInput) {
    priceInput.addEventListener("input", () => {
      const value = priceInput.value;
      // Permitir solo números y un punto decimal
      const cleanValue = value.replace(/[^0-9.]/g, "");
      
      // Asegurar solo un punto decimal
      const parts = cleanValue.split(".");
      if (parts.length > 2) {
        priceInput.value = parts[0] + "." + parts.slice(1).join("");
      } else {
        priceInput.value = cleanValue;
      }
    });
  }

  // Validación de fechas para evitar fechas pasadas
  const checkInInput = $("#check_in");
  if (checkInInput) {
    checkInInput.addEventListener("change", () => {
      const selectedDateTime = new Date(checkInInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Inicio del día actual
      
      const selectedDate = new Date(selectedDateTime);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        checkInInput.style.borderColor = "red";
      } else {
        checkInInput.style.borderColor = "";
      }
    });
  }
};

// Función para convertir número a texto (helper)
const numberToText = (number) => {
  const units = [
    "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
    "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte"
  ];
  
  if (number >= 0 && number <= 20) {
    return units[number] + " pesos";
  }
  
  return number + " pesos";
};

// Función para limpiar errores específicos de un elemento
const clearElementErrors = (element) => {
  if (!element) return;
  const nextSibling = element.nextElementSibling;
  if (nextSibling && nextSibling.classList.contains('error-message')) {
    nextSibling.remove();
  }
};

// Inicializar validaciones cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  setupRealTimeValidation();
  
  // Limpiar errores cuando el usuario empiece a escribir
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      clearElementErrors(input);
    });
    input.addEventListener('change', () => {
      clearElementErrors(input);
    });
  });

  // Auto-completar precio en texto cuando cambie el precio
  const priceInput = $("#price");
  const priceTextInput = $("#price_text");
  
  if (priceInput && priceTextInput) {
    priceInput.addEventListener("input", () => {
      const price = parseFloat(priceInput.value) || 0;
      priceTextInput.value = numberToText(price);
    });
  }

  // Escuchar el evento de envío del formulario
  const submitButton = $("#btn-submit") || $("button[type='submit']");
  const form = $("#formRent") || $("form");

  if (submitButton && form) {
    submitButton.addEventListener("click", (event) => {
      event.preventDefault();
      const formIsValid = validation();
      
      if (formIsValid) {
        console.log("Formulario de renta válido");
        form.submit();
      } else {
        console.log("Formulario de renta inválido");
        // Scroll al primer error
        const firstError = document.querySelector(".error-message");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }
});

// Exportar funciones para uso global
window.RentValidation = {
  validation,
  clearErrors,
  setupRealTimeValidation,
  numberToText,
};
