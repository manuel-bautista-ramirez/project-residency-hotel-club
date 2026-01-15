/**
 * Validaciones para el módulo de Tienda (Store)
 * Maneja formularios de productos y venta rápida
 */

document.addEventListener('DOMContentLoaded', function () {
  console.log('🛡️ Inicializando validaciones de Tienda...');

  /**
   * Función para mostrar notificaciones consistente con el diseño del hotel
   */
  const showMessage = (msg, type = 'success') => {
    if (typeof window.showNotification === 'function') {
      window.showNotification(msg, type);
    } else {
      console.warn('showNotification not found, falling back to alert');
      alert(msg);
    }
  };

  // --- Funciones de utilidad para errores ---
  function markError(input, message) {
    if (!input) return;
    input.classList.add('border-red-500', 'bg-red-50');
    input.classList.remove('border-gray-300', 'border-green-500', 'bg-green-50');

    let errorMsg = input.parentElement.querySelector('.field-error');
    if (!errorMsg) {
      errorMsg = document.createElement('p');
      errorMsg.className = 'field-error text-red-500 text-xs mt-1 font-bold animate-fade-in';
      input.parentElement.appendChild(errorMsg);
    }
    errorMsg.textContent = '⚠️ ' + message;
  }

  function clearError(input) {
    if (!input) return;
    input.classList.remove('border-red-500', 'bg-red-50');
    input.classList.add('border-gray-300');
    const errorMsg = input.parentElement.querySelector('.field-error');
    if (errorMsg) errorMsg.remove();
  }

  // ============================================
  // 1. VALIDACIÓN DE FORMULARIO DE PRODUCTOS
  // ============================================
  const productForm = document.querySelector('form[action^="/store/create"], form[action^="/store/edit"]');

  if (productForm) {
    const nombreInput = productForm.querySelector('#nombre');
    const precioInput = productForm.querySelector('#precio');
    const stockInput = productForm.querySelector('#stock');
    const categoriaSelect = productForm.querySelector('#categoria');

    productForm.addEventListener('submit', function (e) {
      let hasError = false;
      let firstErrorElement = null;

      if (nombreInput && !nombreInput.value.trim()) {
        markError(nombreInput, 'El nombre del producto es obligatorio');
        hasError = true;
        if (!firstErrorElement) firstErrorElement = nombreInput;
      } else if (nombreInput) {
        clearError(nombreInput);
      }

      if (categoriaSelect && !categoriaSelect.value) {
        markError(categoriaSelect, 'Selecciona una categoría');
        hasError = true;
        if (!firstErrorElement) firstErrorElement = categoriaSelect;
      } else if (categoriaSelect) {
        clearError(categoriaSelect);
      }

      if (precioInput && (precioInput.value === '' || parseFloat(precioInput.value) < 0)) {
        markError(precioInput, 'Ingresa un precio válido (mínimo 0)');
        hasError = true;
        if (!firstErrorElement) firstErrorElement = precioInput;
      } else if (precioInput) {
        clearError(precioInput);
      }

      if (stockInput && (stockInput.value === '' || parseInt(stockInput.value) < 0)) {
        markError(stockInput, 'Ingresa un stock inicial válido (mínimo 0)');
        hasError = true;
        if (!firstErrorElement) firstErrorElement = stockInput;
      } else if (stockInput) {
        clearError(stockInput);
      }

      if (hasError) {
        e.preventDefault();
        e.stopPropagation();
        showMessage('Por favor corrige los errores en el formulario', 'error');
        if (firstErrorElement) firstErrorElement.focus();
      } else {
        e.preventDefault(); // Prevenir envío instantáneo para mostrar carga

        // Mostrar carga en el botón
        const submitBtn = productForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
          submitBtn.innerHTML = `
            <svg class="animate-spin h-4 w-4 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
          `;
        }

        showMessage('Guardando cambios...', 'info');

        // Retrasar el envío para que el usuario vea la notificación
        setTimeout(() => {
          productForm.submit();
        }, 800);
      }
    });

    if (precioInput) {
      precioInput.addEventListener('input', function () {
        if (this.value !== '' && parseFloat(this.value) >= 0) clearError(this);
      });
    }
    if (stockInput) {
      stockInput.addEventListener('input', function () {
        if (this.value !== '' && parseInt(this.value) >= 0) clearError(this);
      });
    }
  }

  // ============================================
  // 2. VALIDACIÓN DE MODAL DE VENTA RÁPIDA
  // ============================================
  const saleForm = document.getElementById('sale-form');
  if (saleForm) {
    const quantityInput = document.getElementById('modal-quantity');
    if (quantityInput) {
      quantityInput.addEventListener('input', function () {
        const val = parseInt(this.value);
        const max = parseInt(this.getAttribute('max') || 999);
        if (isNaN(val) || val < 1) {
          this.classList.add('border-red-500', 'text-red-600');
          this.classList.remove('border-gray-300', 'text-gray-900');
        } else if (val > max) {
          this.classList.add('border-orange-500', 'text-orange-600');
          this.classList.remove('border-gray-200');
        } else {
          this.classList.remove('border-red-500', 'text-red-600', 'border-orange-500', 'text-orange-600');
          this.classList.add('border-gray-300');
        }
      });
    }
  }

  // ============================================
  // 3. VALIDACIÓN DE FORMULARIO DE AÑADIR STOCK
  // ============================================
  const addStockForm = document.getElementById('addStockForm');
  if (addStockForm) {
    const quantityInput = addStockForm.querySelector('#quantityToAdd');

    addStockForm.addEventListener('submit', function (e) {
      const val = parseInt(quantityInput.value);
      if (isNaN(val) || val < 1) {
        e.preventDefault();
        markError(quantityInput, 'Ingresa una cantidad válida');
        showMessage('La cantidad debe ser mayor a 0', 'warning');
      } else {
        e.preventDefault();
        const formTarget = e.target;

        // 1. Cerrar el modal instantáneamente para despejar la vista
        if (typeof window.closeAddStockModal === 'function') {
          window.closeAddStockModal();
        } else {
          const m = document.getElementById('addStockModal');
          if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        }

        // 2. Mostrar carga en el botón (por si el modal tardara en ocultarse) y mensaje
        const submitBtn = addStockForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
          submitBtn.innerHTML = `
            <svg class="animate-spin h-3 w-3 text-white inline-block mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
          `;
        }

        showMessage('Actualizando stock de producto...', 'info');

        // 3. Retrasar el envío para dar retroceso visual con el modal ya cerrado
        setTimeout(() => {
          formTarget.submit();
        }, 800);
      }
    });

    if (quantityInput) {
      quantityInput.addEventListener('input', function () {
        if (parseInt(this.value) >= 1) clearError(this);
      });
    }
  }

  // ============================================
  // 4. VALIDACIÓN DE FORMULARIO DE ELIMINAR
  // ============================================
  const deleteForm = document.getElementById('deleteForm');
  if (deleteForm) {
    deleteForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = deleteForm.querySelector('button[type="submit"]');
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

      try {
        // Mostrar carga en el botón
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
          submitBtn.innerHTML = `
            <svg class="animate-spin h-3 w-3 text-white inline-block mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Eliminando...
          `;
        }

        showMessage('Procesando eliminación...', 'info');

        const response = await fetch(deleteForm.action, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (response.ok) {
          // Si el servidor hizo redirect, response.url tendrá la nueva dirección
          showMessage('Producto eliminado correctamente', 'success');
          setTimeout(() => {
            window.location.href = '/store/inventory?success=delete';
          }, 1000);
        } else {
          // Capturar el mensaje de error del servidor
          let errorMsg = await response.text();

          // Si el mensaje es HTML (como una página 404), no lo mostramos completo
          if (errorMsg.includes('<html') || errorMsg.includes('<!DOCTYPE')) {
            errorMsg = 'No es posible eliminar este producto debido a restricciones del sistema o un error interno.';
          }

          showMessage(errorMsg || 'No se pudo eliminar el producto', 'error');

          // Restaurar botón
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            submitBtn.innerHTML = originalBtnHTML;
          }

          // Cerrar modal si el error amerita que el usuario revise la lista
          if (typeof window.closeDeleteModal === 'function') {
            window.closeDeleteModal();
          }
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
        showMessage('Error de red al intentar eliminar el producto', 'error');

        // Restaurar botón
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
          submitBtn.innerHTML = originalBtnHTML;
        }
      }
    });
  }
});
