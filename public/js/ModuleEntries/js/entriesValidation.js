/**
 * Validaciones para el módulo de Entradas (Entries)
 * Maneja el registro de visitantes y configuración de tarifas
 */

document.addEventListener('DOMContentLoaded', function () {
  console.log('🛡️ Inicializando validaciones de Entradas...');

  /**
   * Notificaciones globales (Estilo Rooms)
   */
  const showMessage = (msg, type = 'success') => {
    if (typeof window.showNotification === 'function') {
      window.showNotification(msg, type);
    } else {
      alert(msg);
    }
  };

  // ============================================
  // 1. VALIDACIÓN DE FORMULARIO DE REGISTRO
  // ============================================
  const entryForm = document.getElementById('entryForm');

  if (entryForm) {
    const firstNameInput = document.getElementById('first_name');
    const lastNameInput = document.getElementById('last_name');

    // Regex para solo letras, espacios y acentos
    const textRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    // Validaciones en tiempo real
    const setupLiveValidation = (input) => {
      if (!input) return;
      input.addEventListener('input', function () {
        // Limpiar caracteres no permitidos dinámicamente
        const start = this.selectionStart;
        const originalValue = this.value;
        const cleanedValue = originalValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');

        if (originalValue !== cleanedValue) {
          this.value = cleanedValue;
          // Mantener posición del cursor
          this.setSelectionRange(start - 1, start - 1);
          markError(this, 'Solo se permiten letras');
        } else if (this.value.trim().length > 0) {
          clearError(this);
        }
      });
    };

    setupLiveValidation(firstNameInput);
    setupLiveValidation(lastNameInput);

    // Exponer función de validación global para el módulo
    window.validateEntryForm = function () {
      let hasError = false;
      let firstErrorElement = null;

      // Validar Nombre
      if (!firstNameInput.value.trim()) {
        markError(firstNameInput, 'El nombre es obligatorio');
        hasError = true;
        if (!firstErrorElement) firstErrorElement = firstNameInput;
      } else if (!textRegex.test(firstNameInput.value.trim())) {
        markError(firstNameInput, 'Nombre solo debe contener letras');
        hasError = true;
        if (!firstErrorElement) firstErrorElement = firstNameInput;
      } else {
        clearError(firstNameInput);
      }

      // Validar Apellido
      if (!lastNameInput.value.trim()) {
        markError(lastNameInput, 'El apellido es obligatorio');
        hasError = true;
        if (!firstErrorElement) firstErrorElement = lastNameInput;
      } else if (!textRegex.test(lastNameInput.value.trim())) {
        markError(lastNameInput, 'Apellido solo debe contener letras');
        hasError = true;
        if (!firstErrorElement) firstErrorElement = lastNameInput;
      } else {
        clearError(lastNameInput);
      }

      if (hasError) {
        showMessage('Por favor completa todos los campos requeridos', 'error');
        if (firstErrorElement) firstErrorElement.focus();
        return false;
      }

      return true;
    };
  }

  // ============================================
  // 2. VALIDACIÓN DE CONFIGURACIÓN DE TARIFAS
  // ============================================
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    const inputs = settingsForm.querySelectorAll('input[type="number"]');

    inputs.forEach(input => {
      input.addEventListener('input', function () {
        const val = parseFloat(this.value);
        if (!isNaN(val) && val >= 0) {
          clearError(this);
        } else {
          markError(this, 'Ingresa un precio válido');
        }
      });
    });

    // Interceptar submit
    settingsForm.addEventListener('submit', function (e) {
      let hasError = false;
      inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (isNaN(val) || val < 0) {
          markError(input, 'Precio inválido');
          hasError = true;
        }
      });

      if (hasError) {
        e.preventDefault();
        e.stopPropagation();
        showMessage('Corrige los precios antes de actualizar', 'error');
      } else {
        // La lógica de envío real está en entriesMain.hbs, pero aquí podemos añadir el feedback visual
        // si se enviara de forma tradicional. Como entriesMain.hbs usa fetch,
        // simplemente nos aseguramos de que no bloqueemos el proceso si no hay error.
        console.log('✅ Formulario de configuración validado');
      }
    });
  }

  /**
   * Función para añadir spinner de carga a un botón
   */
  window.setLoadingState = function (button, loadingText = 'Cargando...') {
    if (!button) return null;
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.classList.add('opacity-75', 'cursor-not-allowed');
    button.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      ${loadingText}
    `;
    return originalHTML;
  };

  /**
   * Función para restaurar un botón
   */
  window.removeLoadingState = function (button, originalHTML) {
    if (!button || !originalHTML) return;
    button.disabled = false;
    button.classList.remove('opacity-75', 'cursor-not-allowed');
    button.innerHTML = originalHTML;
  };

  // --- Funciones de utilidad para errores (Estilo Store) ---
  function markError(input, message) {
    // Estilos visuales del input
    input.classList.add('border-red-500', 'bg-red-50');
    input.classList.remove('border-gray-200', 'focus:border-indigo-500', 'focus:ring-indigo-100');

    // Mensaje de error
    let errorMsg = input.parentElement.querySelector('.field-error');
    if (!errorMsg) {
      errorMsg = document.createElement('p');
      errorMsg.className = 'field-error text-red-500 text-[10px] mt-1 font-black uppercase tracking-tight animate-fade-in';
      input.parentElement.appendChild(errorMsg);
    }
    errorMsg.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i> ${message}`;
  }

  function clearError(input) {
    // Restaurar estilos
    input.classList.remove('border-red-500', 'bg-red-50');
    input.classList.add('border-gray-200');

    // Quitar mensaje
    const errorMsg = input.parentElement.querySelector('.field-error');
    if (errorMsg) errorMsg.remove();
  }
});
