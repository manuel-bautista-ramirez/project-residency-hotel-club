/**
 * Archivo principal de validaciones para el módulo de habitaciones
 * Centraliza todas las validaciones y proporciona utilidades comunes
 */

// Utilidades comunes para todas las validaciones
const ValidationUtils = {
  // Función para seleccionar elementos del DOM
  $: (element) => document.querySelector(element),
  $$: (elements) => document.querySelectorAll(elements),

  // Función para eliminar mensajes de error previos
  clearErrors: () => {
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((msg) => msg.remove());
  },

  // Función para crear mensaje de error
  createErrorMessage: (message, color = "red") => {
    const error = document.createElement("p");
    error.style.color = color;
    error.style.fontSize = "12px";
    error.textContent = message;
    error.classList.add("error-message", "error-animation");
    return error;
  },

  // Función para mostrar error después de un elemento
  showError: (element, message, color = "red") => {
    const error = ValidationUtils.createErrorMessage(message, color);
    element.insertAdjacentElement("afterend", error);
  },

  // Función para scroll al primer error
  scrollToFirstError: () => {
    const firstError = document.querySelector(".error-message");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  },

  // Expresiones regulares comunes
  regex: {
    nombre: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    telefono: /^[0-9]{10}$/,
    fecha: /^\d{4}-\d{2}-\d{2}$/,
    fechaHora: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    numeroPositivo: /^(0*[1-9]\d*(\.\d{1,2})?|0*\.\d*[1-9]\d*)$/,
    enteroPositivo: /^[1-9]\d*$/,
    tipoPago: /^(efectivo|tarjeta|transferencia)$/,
    tipoReporte: /^(rentas|reservaciones|consolidado)$/,
  },

  // Mensajes de error comunes
  messages: {
    required: "Este campo no puede estar vacío",
    nombre: "El nombre debe contener solo letras y espacios (2-50 caracteres)",
    email: "Ingrese un correo electrónico válido",
    telefono: "El teléfono debe tener exactamente 10 dígitos",
    fecha: "Seleccione una fecha válida",
    fechaHora: "Seleccione una fecha y hora válida",
    numeroPositivo: "Debe ser un número positivo válido (máximo 2 decimales)",
    enteroPositivo: "Debe ser un número entero positivo",
    tipoPago: "Seleccione un tipo de pago válido",
    tipoReporte: "Seleccione un tipo de reporte válido",
    fechaPasada: "La fecha no puede ser anterior a hoy",
    fechaFutura: "La fecha no puede ser futura",
    fechaSalidaMenor: "La fecha de salida debe ser posterior a la fecha de ingreso",
    rangoFechasMayor: "El rango de fechas no puede ser mayor a 1 año",
  },

  // Función para validar un campo individual
  validateField: (element, regex, message, isOptional = false) => {
    if (!element) return true;

    const value = element.value.trim();

    // Si es opcional y está vacío, es válido
    if (isOptional && !value) return true;

    // Si no es opcional y está vacío, es inválido
    if (!isOptional && !value) {
      ValidationUtils.showError(element, ValidationUtils.messages.required);
      return false;
    }

    // Validar con regex
    if (value && !regex.test(value)) {
      ValidationUtils.showError(element, message, "blue");
      return false;
    }

    return true;
  },

  // Función para validar fechas
  validateDate: (element, allowPast = true, allowFuture = true) => {
    if (!element || !element.value) return true;

    const selectedDate = new Date(element.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!allowPast && selectedDate < today) {
      ValidationUtils.showError(element, ValidationUtils.messages.fechaPasada);
      return false;
    }

    if (!allowFuture && selectedDate > today) {
      ValidationUtils.showError(element, ValidationUtils.messages.fechaFutura);
      return false;
    }

    return true;
  },

  // Función para validar rango de fechas
  validateDateRange: (startElement, endElement) => {
    if (!startElement || !endElement || !startElement.value || !endElement.value) {
      return true;
    }

    const startDate = new Date(startElement.value);
    const endDate = new Date(endElement.value);

    if (endDate <= startDate) {
      ValidationUtils.showError(endElement, ValidationUtils.messages.fechaSalidaMenor);
      return false;
    }

    // Validar que el rango no sea mayor a 1 año
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      ValidationUtils.showError(endElement, ValidationUtils.messages.rangoFechasMayor, "orange");
      return false;
    }

    return true;
  },

  // Función para configurar validación en tiempo real para nombres
  setupNameValidation: (element) => {
    if (!element) return;

    element.addEventListener("input", () => {
      const value = element.value;
      const isValid = ValidationUtils.regex.nombre.test(value);

      element.style.borderColor = isValid ? "" : "red";
    });
  },

  // Función para configurar validación en tiempo real para teléfonos
  setupPhoneValidation: (element) => {
    if (!element) return;

    element.addEventListener("input", () => {
      // Solo permitir números
      element.value = element.value.replace(/[^0-9]/g, "");

      // Limitar a 10 dígitos
      if (element.value.length > 10) {
        element.value = element.value.slice(0, 10);
      }
    });
  },

  // Función para configurar validación en tiempo real para números
  setupNumberValidation: (element) => {
    if (!element) return;

    element.addEventListener("input", () => {
      const value = element.value;
      // Permitir solo números y un punto decimal
      const cleanValue = value.replace(/[^0-9.]/g, "");

      // Asegurar solo un punto decimal
      const parts = cleanValue.split(".");
      if (parts.length > 2) {
        element.value = parts[0] + "." + parts.slice(1).join("");
      } else {
        element.value = cleanValue;
      }
    });
  },

  // Función para convertir número a texto
  numberToText: (number) => {
    const units = [
      "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
      "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
      "dieciocho", "diecinueve", "veinte"
    ];

    if (number >= 0 && number <= 20) {
      return units[number] + " pesos";
    }

    return number + " pesos";
  },

  // Función para mostrar loading en botón
  setButtonLoading: (button, isLoading, loadingText = "Cargando...") => {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  },

  // Función para mostrar notificación
  showNotification: (message, type = "success") => {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      console.warn('Global showNotification not found');
      alert(message);
    }
  },
};

// Exportar utilidades globalmente
window.ValidationUtils = ValidationUtils;

// Auto-inicializar validaciones comunes cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  // Configurar validaciones automáticas para campos comunes
  const nombreInputs = ValidationUtils.$$("input[name*='nombre'], input[name*='client']");
  nombreInputs.forEach(input => ValidationUtils.setupNameValidation(input));

  const telefonoInputs = ValidationUtils.$$("input[name*='telefono'], input[name*='phone']");
  telefonoInputs.forEach(input => ValidationUtils.setupPhoneValidation(input));

  const numeroInputs = ValidationUtils.$$("input[type='number']");
  numeroInputs.forEach(input => ValidationUtils.setupNumberValidation(input));

  console.log("✅ Validaciones del módulo de habitaciones inicializadas");
});

// Exportar para uso en otros módulos
export default ValidationUtils;
