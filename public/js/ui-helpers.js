/**
 * utilidades Globales de Interfaz de Usuario
 * Proporciona helper-functions para estados de carga, confirmaciones y feedback visual.
 */

/**
 * Aplica un estado de carga a un botón.
 * @param {HTMLElement} button - El botón a modificar.
 * @param {string} loadingText - Texto a mostrar junto al spinner.
 * @returns {string} El HTML original del botón para ser restaurado después.
 */
window.setLoadingState = function (button, loadingText = 'Procesando...') {
  if (!button) return null;
  const originalHTML = button.innerHTML;
  button.disabled = true;

  button.classList.add('opacity-75', 'cursor-not-allowed');
  button.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-current inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      ${loadingText}
    `;
  return originalHTML;
};

/**
 * Restaura un botón a su estado original.
 * @param {HTMLElement} button - El botón a restaurar.
 * @param {string} originalHTML - El HTML original retornado por setLoadingState.
 */
window.removeLoadingState = function (button, originalHTML) {
  if (!button || originalHTML === undefined) return;
  button.disabled = false;
  button.classList.remove('opacity-75', 'cursor-not-allowed');
  button.innerHTML = originalHTML;
};

/**
 * Muestra un diálogo de confirmación elegante usando SweetAlert2.
 * @param {Object} options - Opciones de configuración.
 * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise.
 */
window.confirmAction = async function ({
  title = '¿Estás seguro?',
  text = 'Esta acción no se puede deshacer.',
  icon = 'warning',
  confirmButtonText = 'Sí, continuar',
  cancelButtonText = 'Cancelar',
  confirmButtonColor = '#4f46e5',
  danger = false
}) {
  if (typeof Swal === 'undefined') {
    return confirm(`${title}\n${text}`);
  }

  const result = await Swal.fire({
    title: `<span class="text-xl font-bold text-gray-800">${title}</span>`,
    html: `<p class="text-sm text-gray-500">${text}</p>`,
    icon: icon,
    iconColor: danger ? '#ef4444' : confirmButtonColor,
    showCancelButton: true,
    confirmButtonColor: danger ? '#ef4444' : confirmButtonColor,
    cancelButtonColor: '#94a3b8',
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
    borderRadius: '1.25rem',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-3xl border border-gray-100 shadow-2xl',
      confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm transition-all transform hover:scale-105',
      cancelButton: 'px-6 py-2.5 rounded-xl font-bold text-sm transition-all transform hover:scale-105'
    }
  });

  return result.isConfirmed;
};

/**
 * Muestra un overlay de carga global (vinculado a loadingOverlay partial).
 */
window.showGlobalLoader = function (text = 'Procesando...') {
  const loader = document.getElementById('globalLoadingOverlay');
  if (loader) {
    const textEl = loader.querySelector('[data-loading-message]');
    if (textEl) textEl.textContent = text;

    loader.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    loader.classList.add('flex', 'opacity-100');

    const container = loader.querySelector('[data-loading-container]');
    if (container) {
      container.classList.remove('scale-95');
      container.classList.add('scale-100');
    }
  }
};

window.hideGlobalLoader = function () {
  const loader = document.getElementById('globalLoadingOverlay');
  if (loader) {
    loader.classList.add('opacity-0', 'pointer-events-none');

    const container = loader.querySelector('[data-loading-container]');
    if (container) {
      container.classList.add('scale-95');
      container.classList.remove('scale-100');
    }

    setTimeout(() => {
      loader.classList.add('hidden');
      loader.classList.remove('flex', 'opacity-100');
    }, 500);
  }
};
