/**
 * Validaciones para el módulo de Tienda (Store)
 * Maneja formularios de productos y venta rápida
 * Integrado con el sistema global de notificaciones y UI helpers.
 */

document.addEventListener('DOMContentLoaded', function () {
  console.log('🛡️ Inicializando validaciones de Tienda...');

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
        if (typeof window.showNotification === 'function') {
          window.showNotification('Por favor corrige los errores en el formulario', 'error');
        }
        if (firstErrorElement) firstErrorElement.focus();
      } else {
        e.preventDefault();

        const submitBtn = productForm.querySelector('button[type="submit"]');
        if (typeof window.setLoadingState === 'function') {
          window.setLoadingState(submitBtn, 'Guardando...');
        }

        if (typeof window.showNotification === 'function') {
          window.showNotification('Guardando cambios...', 'info');
        }

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
  // 2. VALIDACIÓN DE FORMULARIO DE AÑADIR STOCK
  // ============================================
  const addStockForm = document.getElementById('addStockForm');
  if (addStockForm) {
    const quantityInput = addStockForm.querySelector('#quantityToAdd');

    addStockForm.addEventListener('submit', function (e) {
      const val = parseInt(quantityInput.value);
      if (isNaN(val) || val < 1) {
        e.preventDefault();
        markError(quantityInput, 'Ingresa una cantidad válida');
        if (typeof window.showNotification === 'function') {
          window.showNotification('La cantidad debe ser mayor a 0', 'warning');
        }
      } else {
        e.preventDefault();
        const formTarget = e.target;

        if (typeof window.closeAddStockModal === 'function') {
          window.closeAddStockModal();
        }

        const submitBtn = addStockForm.querySelector('button[type="submit"]');
        if (typeof window.setLoadingState === 'function') {
          window.setLoadingState(submitBtn, 'Guardando...');
        }

        if (typeof window.showNotification === 'function') {
          window.showNotification('Actualizando stock de producto...', 'info');
        }

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
  // 3. FUNCIONES DE UTILIDAD PARA ERRORES
  // ============================================
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
});
