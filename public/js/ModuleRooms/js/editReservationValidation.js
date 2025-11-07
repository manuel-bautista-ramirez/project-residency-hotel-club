// Crea una función para seleccionar elementos del DOM
const $ = (element) => document.querySelector(element);

// Función para eliminar mensajes de error previos
const clearErrors = () => {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());
};

// Función para validar campos del formulario de editar reservación
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
    // Habitación ID
    habitacion_id: {
      element: $("#habitacion_id"),
      regEx: /^[1-9]\d*$/,
      message: "Seleccione una habitación válida",
      isSelect: true,
    },
    // Monto - número positivo
    monto: {
      element: $("#monto"),
      regEx: /^(0*[1-9]\d*(\.\d{1,2})?|0*\.\d*[1-9]\d*)$/,
      message: "El monto debe ser un número positivo válido",
    },
    // Monto en letras
    monto_letras: {
      element: $("#monto_letras"),
      regEx: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,100}$/,
      message: "El monto en letras debe contener solo letras y espacios",
    },
  };

  let isValid = true;

  // Recorre cada campo definido para validar
  for (const field in fields) {
    const { element, regEx, message, isDate, isSelect } = fields[field];

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

    // Validaciones específicas para fechas
    if (isDate && element.value) {
      const selectedDate = new Date(element.value);
      
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

  // Validación de monto en tiempo real
  const montoInput = $("#monto");
  if (montoInput) {
    montoInput.addEventListener("input", () => {
      const value = montoInput.value;
      // Permitir solo números y un punto decimal
      const cleanValue = value.replace(/[^0-9.]/g, "");
      
      // Asegurar solo un punto decimal
      const parts = cleanValue.split(".");
      if (parts.length > 2) {
        montoInput.value = parts[0] + "." + parts.slice(1).join("");
      } else {
        montoInput.value = cleanValue;
      }
    });
  }

  // Validación de monto en letras en tiempo real
  const montoLetrasInput = $("#monto_letras");
  if (montoLetrasInput) {
    montoLetrasInput.addEventListener("input", () => {
      const value = montoLetrasInput.value;
      const isValid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value);
      
      if (!isValid) {
        montoLetrasInput.style.borderColor = "red";
      } else {
        montoLetrasInput.style.borderColor = "";
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

// Función para verificar disponibilidad de habitación
const checkRoomAvailability = async (roomId, fechaIngreso, fechaSalida, excludeReservationId) => {
  try {
    const response = await fetch(`/api/rooms/${roomId}/available?check_in=${fechaIngreso}&check_out=${fechaSalida}&exclude_reservation_id=${excludeReservationId}`);
    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    return false;
  }
};

// Inicializar validaciones cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  setupRealTimeValidation();

  // Auto-completar monto en letras cuando cambie el monto
  const montoInput = $("#monto");
  const montoLetrasInput = $("#monto_letras");
  
  if (montoInput && montoLetrasInput) {
    montoInput.addEventListener("input", () => {
      const monto = parseFloat(montoInput.value) || 0;
      montoLetrasInput.value = numberToText(monto);
    });
  }

  // Verificar disponibilidad cuando cambien las fechas o habitación
  const fechaIngresoInput = $("#fecha_ingreso");
  const fechaSalidaInput = $("#fecha_salida");
  const habitacionSelect = $("#habitacion_id");
  
  const validateAvailability = async () => {
    if (fechaIngresoInput?.value && fechaSalidaInput?.value && habitacionSelect?.value) {
      const reservationId = new URLSearchParams(window.location.search).get('id') || 
                           window.location.pathname.split('/').pop();
      
      const isAvailable = await checkRoomAvailability(
        habitacionSelect.value,
        fechaIngresoInput.value,
        fechaSalidaInput.value,
        reservationId
      );
      
      if (!isAvailable) {
        const error = document.createElement("p");
        error.style.color = "red";
        error.style.fontSize = "12px";
        error.textContent = "La habitación no está disponible en las fechas seleccionadas";
        error.classList.add("error-message", "error-animation");
        habitacionSelect.insertAdjacentElement("afterend", error);
      }
    }
  };

  if (fechaIngresoInput) fechaIngresoInput.addEventListener("change", validateAvailability);
  if (fechaSalidaInput) fechaSalidaInput.addEventListener("change", validateAvailability);
  if (habitacionSelect) habitacionSelect.addEventListener("change", validateAvailability);

  // Escuchar el evento de envío del formulario
  const submitButton = $("#btn-submit") || $("button[type='submit']");
  const form = $("#formEditReservation") || $("form");

  if (submitButton && form) {
    submitButton.addEventListener("click", (event) => {
      event.preventDefault();
      const formIsValid = validation();
      
      if (formIsValid) {
        console.log("Formulario de editar reservación válido");
        form.submit();
      } else {
        console.log("Formulario de editar reservación inválido");
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
window.EditReservationValidation = {
  validation,
  clearErrors,
  setupRealTimeValidation,
  numberToText,
  checkRoomAvailability,
};
