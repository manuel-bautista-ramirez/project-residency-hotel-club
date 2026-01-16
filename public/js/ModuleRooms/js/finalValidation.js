/**
 * Validación final para el módulo de habitaciones
 * Integrado con el sistema global de notificaciones y UI helpers.
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎯 Aplicando validación final integrada...");

  // Función para mostrar error específico en el campo
  const showFieldError = (element, message) => {
    if (!element) return;
    const existingError = element.parentNode.querySelector('.final-error');
    if (existingError) existingError.remove();

    element.classList.add('border-red-500', 'ring-1', 'ring-red-500');

    const error = document.createElement('p');
    error.className = 'final-error text-[10px] text-red-600 mt-1 font-bold uppercase';
    error.textContent = message;
    element.parentNode.appendChild(error);
  };

  const clearFieldError = (element) => {
    if (!element) return;
    element.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    const existingError = element.parentNode.querySelector('.final-error');
    if (existingError) existingError.remove();
  };

  const handleFormSubmit = (formId, fields) => {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      let hasErrors = false;
      let errorList = [];

      fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (!el || !el.value.trim() || (field.type === 'number' && parseFloat(el.value) <= 0)) {
          showFieldError(el, `${field.label} es requerido`);
          errorList.push(field.label);
          hasErrors = true;
        }
      });

      if (hasErrors) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.showNotification === 'function') {
          window.showNotification(`Por favor completa: ${errorList.join(', ')}`, 'error');
        }
        return false;
      }

      // Si es válido, mostrar estado de carga global
      const submitBtn = form.querySelector('button[type="submit"]');
      if (typeof window.setLoadingState === 'function') {
        window.setLoadingState(submitBtn, 'Procesando...');
      }
    }, true);
  };

  // Configurar formas
  handleFormSubmit('formRent', [
    { id: 'client_name', label: 'Nombre' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Teléfono' },
    { id: 'check_in', label: 'Entrada' },
    { id: 'check_out', label: 'Salida' },
    { id: 'payment_type', label: 'Pago' }
  ]);

  handleFormSubmit('formReserve', [
    { id: 'nombre_cliente', label: 'Nombre' },
    { id: 'correo', label: 'Email' },
    { id: 'telefono', label: 'Teléfono' },
    { id: 'fecha_ingreso', label: 'Ingreso' },
    { id: 'fecha_salida', label: 'Salida' }
  ]);

  handleFormSubmit('formEditReservation', [
    { id: 'nombre_cliente', label: 'Nombre' },
    { id: 'fecha_ingreso', label: 'Ingreso' },
    { id: 'fecha_salida', label: 'Salida' },
    { id: 'monto', label: 'Monto', type: 'number' }
  ]);

  document.addEventListener('input', (e) => {
    if (e.target.matches('input, select, textarea')) {
      clearFieldError(e.target);
    }
  });
});
