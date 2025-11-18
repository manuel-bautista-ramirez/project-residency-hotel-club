// Crea una función para seleccionar elementos del DOM
const $ = (element) => document.querySelector(element);
const $$ = (elements) => document.querySelectorAll(elements);

// Función para eliminar mensajes de error previos
const clearErrors = () => {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((msg) => msg.remove());
};

// Función para validar un campo de precio individual
const validatePriceField = (element) => {
  if (!element) return true;

  const value = element.value.trim();
  
  // Si está vacío, es válido (los precios pueden estar vacíos)
  if (!value) return true;

  // Validar que sea un número positivo
  const priceRegex = /^(0*[1-9]\d*(\.\d{1,2})?|0*\.\d*[1-9]\d*)$/;
  
  if (!priceRegex.test(value)) {
    const error = document.createElement("p");
    error.style.color = "red";
    error.style.fontSize = "12px";
    error.textContent = "Debe ser un número positivo válido (máximo 2 decimales)";
    error.classList.add("error-message", "error-animation");
    element.insertAdjacentElement("afterend", error);
    return false;
  }

  return true;
};

// Función para validar todos los campos de precios
const validation = () => {
  clearErrors();

  let isValid = true;
  
  // Obtener todos los inputs de precio
  const priceInputs = $$("input[type='number'][step='0.01']");
  
  priceInputs.forEach(input => {
    if (!validatePriceField(input)) {
      isValid = false;
    }
  });

  // Validar que al menos un precio haya sido modificado si se está enviando el formulario
  const hasModifiedPrices = Array.from(priceInputs).some(input => {
    const originalValue = input.dataset.originalValue || "0";
    return input.value !== originalValue && input.value.trim() !== "";
  });

  if (!hasModifiedPrices) {
    const error = document.createElement("p");
    error.style.color = "orange";
    error.style.fontSize = "12px";
    error.textContent = "Debe modificar al menos un precio antes de guardar";
    error.classList.add("error-message", "error-animation");
    
    // Insertar el mensaje al inicio del formulario
    const form = $("form") || $(".prices-container");
    if (form) {
      form.insertAdjacentElement("afterbegin", error);
    }
    
    isValid = false;
  }

  return isValid;
};

// Validación en tiempo real para campos de precio
const setupRealTimeValidation = () => {
  const priceInputs = $$("input[type='number'][step='0.01']");
  
  priceInputs.forEach(input => {
    // Guardar el valor original para comparación
    input.dataset.originalValue = input.value || "0";
    
    input.addEventListener("input", () => {
      const value = input.value;
      
      // Permitir solo números y un punto decimal
      const cleanValue = value.replace(/[^0-9.]/g, "");
      
      // Asegurar solo un punto decimal
      const parts = cleanValue.split(".");
      if (parts.length > 2) {
        input.value = parts[0] + "." + parts.slice(1).join("");
      } else {
        input.value = cleanValue;
      }

      // Validar en tiempo real
      const isValid = validatePriceField(input);
      
      if (isValid) {
        input.style.borderColor = "";
        input.style.backgroundColor = "";
      } else {
        input.style.borderColor = "red";
        input.style.backgroundColor = "#fef2f2";
      }

      // Marcar como modificado si es diferente al valor original
      const originalValue = input.dataset.originalValue || "0";
      if (input.value !== originalValue && input.value.trim() !== "") {
        input.style.backgroundColor = "#f0f9ff";
        input.style.borderColor = "#3b82f6";
      }
    });

    // Validar cuando pierde el foco
    input.addEventListener("blur", () => {
      validatePriceField(input);
    });
  });
};

// Función para resaltar cambios
const highlightChanges = () => {
  const priceInputs = $$("input[type='number'][step='0.01']");
  
  priceInputs.forEach(input => {
    const originalValue = input.dataset.originalValue || "0";
    const currentValue = input.value.trim();
    
    if (currentValue !== originalValue && currentValue !== "") {
      input.classList.add("modified-price");
      input.style.backgroundColor = "#f0f9ff";
      input.style.borderColor = "#3b82f6";
    } else {
      input.classList.remove("modified-price");
      input.style.backgroundColor = "";
      input.style.borderColor = "";
    }
  });
};

// Función para actualizar precio individual
const updateSinglePrice = async (tipo, mes, monto) => {
  try {
    const response = await fetch("/api/rooms/update-precio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tipo, mes, monto }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error actualizando precio:", error);
    return false;
  }
};

// Función para actualizar múltiples precios
const updateBulkPrices = async (changes) => {
  try {
    const response = await fetch("/api/rooms/update-precios-bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ changes }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error actualizando precios:", error);
    return { success: false, error: error.message };
  }
};

// Inicializar validaciones cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  setupRealTimeValidation();

  // Resaltar cambios cada vez que se modifique un campo
  const priceInputs = $$("input[type='number'][step='0.01']");
  priceInputs.forEach(input => {
    input.addEventListener("input", highlightChanges);
  });

  // Escuchar el evento de envío del formulario
  const submitButton = $("#btn-submit") || $("#save-prices") || $("button[type='submit']");
  const form = $("#formPrices") || $("form");

  if (submitButton) {
    submitButton.addEventListener("click", async (event) => {
      event.preventDefault();
      
      const formIsValid = validation();
      
      if (formIsValid) {
        console.log("Formulario de precios válido");
        
        // Recopilar cambios
        const changes = [];
        const priceInputs = $$("input[type='number'][step='0.01']");
        
        priceInputs.forEach(input => {
          const originalValue = input.dataset.originalValue || "0";
          const currentValue = input.value.trim();
          
          if (currentValue !== originalValue && currentValue !== "") {
            // Extraer tipo y mes del ID o data attributes
            const tipo = input.dataset.tipo || input.getAttribute("data-tipo");
            const mes = input.dataset.mes || input.getAttribute("data-mes");
            
            if (tipo && mes) {
              changes.push({
                tipo: tipo,
                mes: parseInt(mes),
                monto: parseFloat(currentValue)
              });
            }
          }
        });

        if (changes.length > 0) {
          // Mostrar loading
          submitButton.disabled = true;
          submitButton.textContent = "Guardando...";
          
          // Actualizar precios
          const result = await updateBulkPrices(changes);
          
          if (result.success) {
            alert("Precios actualizados correctamente");
            // Actualizar valores originales
            priceInputs.forEach(input => {
              input.dataset.originalValue = input.value;
            });
            highlightChanges();
          } else {
            alert("Error al actualizar precios: " + (result.error || "Error desconocido"));
          }
          
          // Restaurar botón
          submitButton.disabled = false;
          submitButton.textContent = "Guardar Cambios";
        } else {
          alert("No hay cambios para guardar");
        }
      } else {
        console.log("Formulario de precios inválido");
        // Scroll al primer error
        const firstError = document.querySelector(".error-message");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }

  // Botón para resetear cambios
  const resetButton = $("#reset-prices");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      const priceInputs = $$("input[type='number'][step='0.01']");
      priceInputs.forEach(input => {
        input.value = input.dataset.originalValue || "0";
      });
      highlightChanges();
      clearErrors();
    });
  }
});

// Exportar funciones para uso global
window.PricesValidation = {
  validation,
  clearErrors,
  setupRealTimeValidation,
  validatePriceField,
  highlightChanges,
  updateSinglePrice,
  updateBulkPrices,
};
