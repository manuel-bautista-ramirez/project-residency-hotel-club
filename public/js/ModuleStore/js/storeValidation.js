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
            return;
        }

        const area = document.getElementById('notification-area') || document.body;
        const notif = document.createElement('div');

        // Estilos base
        let classes = "fixed top-4 right-4 z-[100] p-4 mb-4 text-sm font-bold rounded-lg shadow-xl flex items-center gap-2 animate-fade-in transition-all duration-300 ";

        if (type === 'success') classes += "bg-white border-l-4 border-green-500 text-green-700";
        else if (type === 'error') classes += "bg-white border-l-4 border-red-500 text-red-700";
        else if (type === 'warning') classes += "bg-white border-l-4 border-yellow-500 text-yellow-700";
        else classes += "bg-white border-l-4 border-blue-500 text-blue-700";

        notif.className = classes;
        notif.style.minWidth = "300px";

        const icon = type === 'success' ? 'fa-check-circle' :
                     type === 'error' ? 'fa-exclamation-circle' :
                     type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

        notif.innerHTML = `
            <i class="fas ${icon} text-lg"></i>
            <div class="flex-grow">${msg}</div>
            <button class="ml-2 hover:opacity-70" onclick="this.parentElement.remove()">&times;</button>
        `;

        document.body.appendChild(notif);

        setTimeout(() => {
            notif.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => notif.remove(), 300);
        }, 5000);
    };

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

            // Validar Nombre
            if (!nombreInput.value.trim()) {
                markError(nombreInput, 'El nombre del producto es obligatorio');
                hasError = true;
                if (!firstErrorElement) firstErrorElement = nombreInput;
            } else {
                clearError(nombreInput);
            }

            // Validar Categoría
            if (!categoriaSelect.value) {
                markError(categoriaSelect, 'Selecciona una categoría');
                hasError = true;
                if (!firstErrorElement) firstErrorElement = categoriaSelect;
            } else {
                clearError(categoriaSelect);
            }

            // Validar Precio
            if (precioInput.value === '' || parseFloat(precioInput.value) < 0) {
                markError(precioInput, 'Ingresa un precio válido (mínimo 0)');
                hasError = true;
                if (!firstErrorElement) firstErrorElement = precioInput;
            } else {
                clearError(precioInput);
            }

            // Validar Stock
            if (stockInput.value === '' || parseInt(stockInput.value) < 0) {
                markError(stockInput, 'Ingresa un stock inicial válido (mínimo 0)');
                hasError = true;
                if (!firstErrorElement) firstErrorElement = stockInput;
            } else {
                clearError(stockInput);
            }

            if (hasError) {
                e.preventDefault();
                e.stopPropagation();
                showMessage('Por favor corrige los errores en el formulario', 'error');
                if (firstErrorElement) firstErrorElement.focus();
            }
        });

        // Validaciones en tiempo real
        if (precioInput) {
            precioInput.addEventListener('input', function() {
                if (this.value !== '' && parseFloat(this.value) >= 0) {
                    clearError(this);
                }
            });
        }
        if (stockInput) {
            stockInput.addEventListener('input', function() {
                if (this.value !== '' && parseInt(this.value) >= 0) {
                    clearError(this);
                }
            });
        }
    }

    // ============================================
    // 2. VALIDACIÓN DE MODAL DE VENTA RÁPIDA
    // ============================================
    const saleForm = document.getElementById('sale-form');
    if (saleForm) {
        const quantityInput = document.getElementById('modal-quantity');

        // El envío ya maneja validación, pero vamos a añadir feedback visual
        quantityInput.addEventListener('input', function() {
            const val = parseInt(this.value);
            const max = parseInt(this.getAttribute('max') || 999);

            if (isNaN(val) || val < 1) {
                this.classList.add('border-red-500', 'text-red-600');
                this.classList.remove('border-gray-300', 'text-gray-900');
            } else if (val > max) {
                this.classList.add('border-orange-500', 'text-orange-600');
                this.classList.remove('border-gray-300', 'text-gray-900');
            } else {
                this.classList.remove('border-red-500', 'text-red-600', 'border-orange-500', 'text-orange-600');
                this.classList.add('border-gray-300', 'text-gray-900');
            }
        });
    }

    // ============================================
    // 3. VALIDACIÓN DE FORMULARIO DE AÑADIR STOCK
    // ============================================
    const addStockForm = document.getElementById('addStockForm');
    if (addStockForm) {
        const quantityToAddInput = addStockForm.querySelector('#quantityToAdd');

        addStockForm.addEventListener('submit', function(e) {
            const val = parseInt(quantityToAddInput.value);
            if (isNaN(val) || val < 1) {
                e.preventDefault();
                markError(quantityToAddInput, 'Ingresa una cantidad válida a añadir (mínimo 1)');
                showMessage('La cantidad a añadir debe ser mayor a 0', 'warning');
            } else {
                clearError(quantityToAddInput);
            }
        });

        if (quantityToAddInput) {
            quantityToAddInput.addEventListener('input', function() {
                if (parseInt(this.value) >= 1) {
                    clearError(this);
                }
            });
        }
    }

    // --- Funciones de utilidad para errores ---
    function markError(input, message) {
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
        input.classList.remove('border-red-500', 'bg-red-50');
        input.classList.add('border-gray-300');
        const errorMsg = input.parentElement.querySelector('.field-error');
        if (errorMsg) errorMsg.remove();
    }
});
