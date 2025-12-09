// Crea una función para seleccionar elementos del DOM
const $ = (element) => document.querySelector(element);
const $$ = (elements) => document.querySelectorAll(elements);

// Función para eliminar mensajes de error previos
const clearErrors = () => {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());
};

// Función para validar campos del formulario de reportes
const validation = () => {
  clearErrors();

  // Define los campos del formulario y sus reglas de validación
  const fields = {
    // Tipo de reporte
    tipo: {
      element: $("#tipo"),
      regEx: /^(rentas|reservaciones|consolidado)$/,
      message: "Seleccione un tipo de reporte válido",
      isSelect: true,
    },
    // Fecha de inicio
    fechaInicio: {
      element: $("#fechaInicio"),
      regEx: /^\d{4}-\d{2}-\d{2}$/,
      message: "Seleccione una fecha de inicio válida",
      isDate: true,
    },
    // Fecha de fin
    fechaFin: {
      element: $("#fechaFin"),
      regEx: /^\d{4}-\d{2}-\d{2}$/,
      message: "Seleccione una fecha de fin válida",
      isDate: true,
    },
    // Habitación (opcional)
    habitacion: {
      element: $("#habitacion"),
      regEx: /^[1-9]\d*$/,
      message: "Seleccione una habitación válida",
      isOptional: true,
      isSelect: true,
    },
    // Cliente (opcional)
    cliente: {
      element: $("#cliente"),
      regEx: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/,
      message: "El nombre del cliente debe contener solo letras y espacios (2-50 caracteres)",
      isOptional: true,
    },
    // Tipo de pago (opcional)
    tipoPago: {
      element: $("#tipoPago"),
      regEx: /^(efectivo|tarjeta|transferencia)$/,
      message: "Seleccione un tipo de pago válido",
      isOptional: true,
      isSelect: true,
    },
  };

  let isValid = true;

  // Recorre cada campo definido para validar
  for (const field in fields) {
    const { element, regEx, message, isDate, isOptional, isSelect } = fields[field];

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
      today.setHours(23, 59, 59, 999); // Permitir hasta hoy

      if (selectedDate > today) {
        const error = document.createElement("p");
        error.style.color = "red";
        error.style.fontSize = "12px";
        error.textContent = "La fecha no puede ser futura";
        error.classList.add("error-message", "error-animation");
        element.insertAdjacentElement("afterend", error);
        isValid = false;
        continue;
      }

      if (field === "fechaFin") {
        const fechaInicio = new Date($("#fechaInicio").value);
        if (selectedDate < fechaInicio) {
          const error = document.createElement("p");
          error.style.color = "red";
          error.style.fontSize = "12px";
          error.textContent = "La fecha de fin debe ser posterior o igual a la fecha de inicio";
          error.classList.add("error-message", "error-animation");
          element.insertAdjacentElement("afterend", error);
          isValid = false;
          continue;
        }

        // Validar que el rango no sea mayor a 1 año
        const diffTime = Math.abs(selectedDate - fechaInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 365) {
          const error = document.createElement("p");
          error.style.color = "orange";
          error.style.fontSize = "12px";
          error.textContent = "El rango de fechas no puede ser mayor a 1 año";
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
  // Validación de cliente en tiempo real
  const clienteInput = $("#cliente");
  if (clienteInput) {
    clienteInput.addEventListener("input", () => {
      const value = clienteInput.value;
      const isValid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value);
      
      if (!isValid) {
        clienteInput.style.borderColor = "red";
      } else {
        clienteInput.style.borderColor = "";
      }
    });
  }

  // Validación de fechas para evitar fechas futuras
  const fechaInputs = $$("input[type='date']");
  fechaInputs.forEach(input => {
    input.addEventListener("change", () => {
      const selectedDate = new Date(input.value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate > today) {
        input.style.borderColor = "red";
      } else {
        input.style.borderColor = "";
      }
    });
  });

  // Establecer fecha máxima como hoy
  const today = new Date().toISOString().split('T')[0];
  fechaInputs.forEach(input => {
    input.setAttribute('max', today);
  });
};

// Función para generar reporte
const generateReport = async (formData) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Agregar parámetros obligatorios
    queryParams.append('tipo', formData.tipo);
    queryParams.append('fechaInicio', formData.fechaInicio);
    queryParams.append('fechaFin', formData.fechaFin);
    
    // Agregar parámetros opcionales si tienen valor
    if (formData.habitacion) queryParams.append('habitacion', formData.habitacion);
    if (formData.cliente) queryParams.append('cliente', formData.cliente);
    if (formData.tipoPago) queryParams.append('tipoPago', formData.tipoPago);

    const response = await fetch(`/api/rooms/reports/generate?${queryParams.toString()}`);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error("Error generando reporte:", error);
    return { success: false, error: error.message };
  }
};

// Función para enviar reporte por email
const sendReportByEmail = async (reportData, email) => {
  try {
    const response = await fetch("/api/rooms/reports/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportData, email }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error enviando reporte por email:", error);
    return { success: false, error: error.message };
  }
};

// Función para mostrar resultados del reporte
const displayReportResults = (reportData) => {
  const resultsContainer = $("#report-results") || $("#results");
  
  if (!resultsContainer) {
    console.error("Contenedor de resultados no encontrado");
    return;
  }

  // Limpiar resultados anteriores
  resultsContainer.innerHTML = "";

  if (!reportData.success) {
    resultsContainer.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <p class="text-red-800 text-sm">Error: ${reportData.error}</p>
      </div>
    `;
    return;
  }

  // Mostrar resultados
  const reporte = reportData.reporte;
  
  resultsContainer.innerHTML = `
    <div class="bg-green-50 border border-green-200 rounded-md p-4">
      <h3 class="text-green-800 font-semibold text-lg mb-3">Reporte Generado</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">${reporte.total_registros || 0}</p>
          <p class="text-sm text-green-700">Total Registros</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">$${(reporte.total_ingresos || 0).toLocaleString()}</p>
          <p class="text-sm text-blue-700">Total Ingresos</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-purple-600">${reporte.habitaciones_utilizadas || 0}</p>
          <p class="text-sm text-purple-700">Habitaciones Utilizadas</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button id="download-report" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          Descargar PDF
        </button>
        <button id="email-report" class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
          Enviar por Email
        </button>
      </div>
    </div>
  `;

  // Agregar event listeners para los botones
  const downloadBtn = $("#download-report");
  const emailBtn = $("#email-report");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      // Implementar descarga de PDF
      console.log("Descargando reporte...");
    });
  }

  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      const email = prompt("Ingrese el email de destino:");
      if (email) {
        sendReportByEmail(reporte, email);
      }
    });
  }
};

// Inicializar validaciones cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  setupRealTimeValidation();

  // Detectar si estamos en una página que usa este formulario de reportes
  const form = $("#formReports") || $("form");
  const submitButton = $("#btn-submit") || $("#generate-report") || $("button[type='submit']");

  // Si no hay formulario ni botón, no hacemos nada (evita errores en otras vistas como /rooms/reportes)
  if (!form || !submitButton) {
    return;
  }

  // Establecer fechas por defecto (último mes)
  const fechaFinInput = $("#fechaFin");
  const fechaInicioInput = $("#fechaInicio");
  
  if (fechaFinInput && fechaInicioInput) {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    fechaFinInput.value = today.toISOString().split('T')[0];
    fechaInicioInput.value = lastMonth.toISOString().split('T')[0];
  }

  // Escuchar el evento de envío del formulario
  if (submitButton) {
    submitButton.addEventListener("click", async (event) => {
      event.preventDefault();
      
      const formIsValid = validation();
      
      if (formIsValid) {
        console.log("Formulario de reportes válido");
        
        // Recopilar datos del formulario
        const formData = {
          tipo: $("#tipo")?.value,
          fechaInicio: $("#fechaInicio")?.value,
          fechaFin: $("#fechaFin")?.value,
          habitacion: $("#habitacion")?.value,
          cliente: $("#cliente")?.value,
          tipoPago: $("#tipoPago")?.value,
        };

        // Mostrar loading
        submitButton.disabled = true;
        submitButton.textContent = "Generando...";
        
        // Generar reporte
        const result = await generateReport(formData);
        
        // Mostrar resultados
        displayReportResults(result);
        
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.textContent = "Generar Reporte";
      } else {
        console.log("Formulario de reportes inválido");
        // Scroll al primer error
        const firstError = document.querySelector(".error-message");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }

  // Botón para limpiar filtros
  const clearButton = $("#clear-filters");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      const form = $("#formReports") || $("form");
      if (form) {
        form.reset();
        
        // Restablecer fechas por defecto
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        if (fechaFinInput) fechaFinInput.value = today.toISOString().split('T')[0];
        if (fechaInicioInput) fechaInicioInput.value = lastMonth.toISOString().split('T')[0];
      }
      
      clearErrors();
      
      // Limpiar resultados
      const resultsContainer = $("#report-results") || $("#results");
      if (resultsContainer) {
        resultsContainer.innerHTML = "";
      }
    });
  }
});

// Exportar funciones para uso global
window.ReportsValidation = {
  validation,
  clearErrors,
  setupRealTimeValidation,
  generateReport,
  sendReportByEmail,
  displayReportResults,
};
