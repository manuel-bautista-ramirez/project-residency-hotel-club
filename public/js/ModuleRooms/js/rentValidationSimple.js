// Validación simple para rentas - Solo limpiar errores y validar en envío
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔧 Aplicando validación simple para rentas...");

  // Función para limpiar mensajes de error
  const clearFieldErrors = (element) => {
    if (!element) return;
    const parent = element.parentNode;
    const errors = parent.querySelectorAll('.error-message');
    errors.forEach(error => error.remove());
  };

  // Función para mostrar error
  const showFieldError = (element, message, color = 'red') => {
    clearFieldErrors(element);
    const error = document.createElement('p');
    error.className = 'error-message text-xs mt-1';
    error.style.color = color;
    error.textContent = message;
    element.parentNode.appendChild(error);
  };

  // Obtener elementos del formulario
  const checkInInput = document.getElementById('check_in');
  const checkOutInput = document.getElementById('check_out');
  const clientNameInput = document.getElementById('client_name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');

  // Limpiar errores cuando el usuario interactúe con los campos
  const inputs = [checkInInput, checkOutInput, clientNameInput, emailInput, phoneInput];
  
  inputs.forEach(input => {
    if (input) {
      // Limpiar errores al hacer foco
      input.addEventListener('focus', () => {
        clearFieldErrors(input);
        input.style.borderColor = '';
      });

      // Limpiar errores al escribir
      input.addEventListener('input', () => {
        clearFieldErrors(input);
        input.style.borderColor = '';
      });

      // Limpiar errores al cambiar
      input.addEventListener('change', () => {
        clearFieldErrors(input);
        input.style.borderColor = '';
      });
    }
  });

  // Validación específica para teléfono (solo números, máximo 10)
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      clearFieldErrors(phoneInput);
      
      // Permitir solo números
      let value = phoneInput.value.replace(/[^0-9]/g, '');
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      phoneInput.value = value;
      phoneInput.style.borderColor = '';
    });
  }

  // Solo validar en el envío del formulario
  const form = document.getElementById('formRent');
  if (form) {
    // NO clonar para preservar funcionalidades existentes
    form.addEventListener('submit', (e) => {
      // SIEMPRE prevenir el envío inicial para validar
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🔍 Validando formulario de renta...');
      
      let hasErrors = false;

      // Limpiar errores previos
      document.querySelectorAll('.error-message').forEach(error => error.remove());
      inputs.forEach(input => {
        if (input) input.style.borderColor = '';
      });

      // Validar solo campos críticos (más permisivo)
      const criticalFields = [
        { element: document.getElementById('client_name'), name: 'Nombre del cliente' },
        { element: document.getElementById('check_in'), name: 'Fecha de entrada' },
        { element: document.getElementById('check_out'), name: 'Fecha de salida' }
      ];

      criticalFields.forEach(field => {
        if (field.element && !field.element.value.trim()) {
          showFieldError(field.element, `${field.name} es requerido`);
          field.element.style.borderColor = 'red';
          hasErrors = true;
        }
      });

      // Validar formato de email
      const email = document.getElementById('email');
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        showFieldError(email, 'Formato de email inválido');
        email.style.borderColor = 'red';
        hasErrors = true;
      }

      // Validar teléfono
      const phone = document.getElementById('phone');
      if (phone && phone.value && phone.value.length !== 10) {
        showFieldError(phone, 'El teléfono debe tener 10 dígitos');
        phone.style.borderColor = 'red';
        hasErrors = true;
      }

      // Validar fechas solo si hay valores
      const checkIn = document.getElementById('check_in');
      const checkOut = document.getElementById('check_out');
      
      if (checkIn && checkIn.value && checkOut && checkOut.value) {
        // Solo validar que la fecha de salida sea posterior a la de entrada
        if (checkOut.value <= checkIn.value) {
          showFieldError(checkOut, 'La fecha de salida debe ser posterior a la fecha de entrada');
          checkOut.style.borderColor = 'red';
          hasErrors = true;
        }
      }

      if (hasErrors) {
        // Scroll al primer error
        const firstError = document.querySelector('.error-message');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        console.log('❌ Formulario tiene errores, envío BLOQUEADO');
        
        // Mostrar notificación de error
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md shadow-lg';
        notification.innerHTML = `
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm font-medium">Por favor corrige los errores antes de continuar</span>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove notification
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 5000);
        
        return false; // BLOQUEAR envío
      }

      console.log('✅ Formulario válido, procediendo con el envío');
      
      // Mostrar notificación de éxito
      const successNotification = document.createElement('div');
      successNotification.className = 'fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md shadow-lg';
      successNotification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="text-sm font-medium">Formulario válido, creando renta...</span>
        </div>
      `;
      document.body.appendChild(successNotification);
      
      // Enviar el formulario programáticamente
      setTimeout(() => {
        form.submit();
      }, 500);
    });
  }

  // Limpiar cualquier error existente al cargar la página
  setTimeout(() => {
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());
    
    // Resetear estilos de borde
    inputs.forEach(input => {
      if (input) {
        input.style.borderColor = '';
      }
    });
  }, 100);

  console.log("✅ Validación simple de rentas aplicada correctamente");
});
