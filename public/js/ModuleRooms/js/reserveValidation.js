// Crea una función para seleccionar elementos del DOM
const $ = (element) => document.querySelector(element);

// Función para eliminar mensajes de error previos
const clearErrors = () => {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());
};

// Función para validar campos del formulario de reservación
const validation = () => {
  clearErrors();

  // Define los campos del formulario y sus reglas de validación
  const fields = {
    // Nombre del cliente - solo letras y espacios
    nombre_cliente: {
      element: $("#nombre_cliente"),
      regEx: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/,
      message: "El nombre debe contener solo letras y espacios (2-50 caracteres)",
    },
    // Correo electrónico
    correo: {
      element: $("#correo"),
      regEx: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Ingrese un correo electrónico válido",
    },
    // Teléfono - 10 dígitos
    telefono: {
      element: $("#telefono"),
      regEx: /^[0-9]{10}$/,
      message: "El teléfono debe tener exactamente 10 dígitos",
    },
    // Fecha de ingreso
    fecha_ingreso: {
      element: $("#fecha_ingreso"),
      regEx: /^\d{4}-\d{2}-\d{2}$/,
      message: "Seleccione una fecha de ingreso válida",
      isDate: true,
    },
    // Fecha de salida
    fecha_salida: {
      element: $("#fecha_salida"),
      regEx: /^\d{4}-\d{2}-\d{2}$/,
      message: "Seleccione una fecha de salida válida",
      isDate: true,
    },
    // Enganche - número positivo (opcional)
    enganche: {
      element: $("#enganche"),
      regEx: /^(0|[1-9]\d*(\.\d{1,2})?)$/,
      message: "El enganche debe ser un número válido (máximo 2 decimales)",
      isOptional: true,
    },
  };

  let isValid = true;

  // Recorre cada campo definido para validar
  for (const field in fields) {
    const { element, regEx, message, isDate, isOptional } = fields[field];

    if (!element) continue; // Si el elemento no existe, continuar

    // Validar campos vacíos (excepto los opcionales)
    if (!element.value.trim() && !isOptional) {
      const error = document.createElement("p");
      error.style.color = "red";
      error.style.fontSize = "12px";
      error.textContent = "Este campo no puede estar vacío";
      error.classList.add("error-message", "error-animation");
      element.insertAdjacentElement("afterend", error);
      isValid = false;
      continue;
    }

    // Si es opcional y está vacío, continuar
    if (isOptional && !element.value.trim()) {
      continue;
    }

    // Validaciones específicas para fechas
    if (isDate && element.value) {
      const selectedDate = new Date(element.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (field === "fecha_ingreso" && selectedDate < today) {
        const error = document.createElement("p");
        error.style.color = "red";
        error.style.fontSize = "12px";
        error.textContent = "La fecha de ingreso no puede ser anterior a hoy";
        error.classList.add("error-message", "error-animation");
        element.insertAdjacentElement("afterend", error);
        isValid = false;
        continue;
      }

      if (field === "fecha_salida") {
        const fechaIngreso = new Date($("#fecha_ingreso").value);
        if (selectedDate <= fechaIngreso) {
          const error = document.createElement("p");
          error.style.color = "red";
          error.style.fontSize = "12px";
          error.textContent = "La fecha de salida debe ser posterior a la fecha de ingreso";
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
  const nombreInput = $("#nombre_cliente");
  if (nombreInput) {
    nombreInput.addEventListener("input", () => {
      const value = nombreInput.value;
      const isValid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value);
      
      if (!isValid) {
        nombreInput.style.borderColor = "red";
      } else {
        nombreInput.style.borderColor = "";
      }
    });
  }

  // Validación de teléfono en tiempo real
  const telefonoInput = $("#telefono");
  if (telefonoInput) {
    telefonoInput.addEventListener("input", () => {
      // Solo permitir números
      telefonoInput.value = telefonoInput.value.replace(/[^0-9]/g, "");
      
      // Limitar a 10 dígitos
      if (telefonoInput.value.length > 10) {
        telefonoInput.value = telefonoInput.value.slice(0, 10);
      }
    });
  }

  // Validación de enganche en tiempo real
  const engancheInput = $("#enganche");
  if (engancheInput) {
    engancheInput.addEventListener("input", () => {
      const value = engancheInput.value;
      // Permitir solo números y un punto decimal
      const cleanValue = value.replace(/[^0-9.]/g, "");
      
      // Asegurar solo un punto decimal
      const parts = cleanValue.split(".");
      if (parts.length > 2) {
        engancheInput.value = parts[0] + "." + parts.slice(1).join("");
      } else {
        engancheInput.value = cleanValue;
      }
    });
  }
};

// Inicializar validaciones cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  setupRealTimeValidation();

  // Escuchar el evento de envío del formulario
  const submitButton = $("#btn-submit") || $("button[type='submit']");
  const form = $("#formReserve");

  if (submitButton && form) {
    submitButton.addEventListener("click", (event) => {
      event.preventDefault();
      const formIsValid = validation();
      
      if (formIsValid) {
        console.log("Formulario de reservación válido");
        form.submit();
      } else {
        console.log("Formulario de reservación inválido");
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
window.ReserveValidation = {
  validation,
  clearErrors,
  setupRealTimeValidation,
};
