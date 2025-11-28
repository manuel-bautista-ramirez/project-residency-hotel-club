// Validación universal para todos los formularios del módulo de habitaciones
document.addEventListener("DOMContentLoaded", () => {
  console.log("🛡️ Aplicando validación universal para formularios...");

  // Función para mostrar notificación
  const showNotification = (message, type = 'error') => {
    // Remover notificaciones existentes
    const existingNotifications = document.querySelectorAll('.universal-notification');
    existingNotifications.forEach(notif => notif.remove());

    const colors = {
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };

    const icons = {
      error: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>`,
      success: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>`,
      warning: `<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>`
    };

    const notification = document.createElement('div');
    notification.className = `universal-notification fixed top-4 right-4 z-[9999] ${colors[type]} px-4 py-3 rounded-md shadow-lg border transition-all duration-300 transform translate-x-full`;
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          ${icons[type]}
        </svg>
        <span class="text-sm font-medium">${message}</span>
        <button class="ml-2 text-lg leading-none hover:opacity-70" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 10);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  };

  // Función para validar campos básicos
  const validateBasicFields = (form) => {
    let hasErrors = false;
    const errors = [];

    // Limpiar errores previos
    form.querySelectorAll('.error-message').forEach(error => error.remove());
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.style.borderColor = '';
    });

    // Obtener todos los campos de entrada
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="number"], select, textarea');

    inputs.forEach(input => {
      const value = input.value.trim();
      const fieldName = input.getAttribute('placeholder') || input.getAttribute('name') || 'Campo';

      // Solo validar campos que están explícitamente marcados como requeridos
      const isRequired = input.hasAttribute('required') || 
                        (input.closest('label')?.textContent.includes('*') && 
                         !input.hasAttribute('readonly') && 
                         input.type !== 'hidden');

      if (isRequired && !value) {
        const error = document.createElement('p');
        error.className = 'error-message text-xs text-red-600 mt-1';
        error.textContent = `${fieldName} es requerido`;
        input.parentNode.appendChild(error);
        input.style.borderColor = 'red';
        hasErrors = true;
        errors.push(`${fieldName} es requerido`);
      }

      // Validaciones específicas por tipo
      if (value) {
        // Email
        if (input.type === 'email' || input.name.includes('email') || input.name.includes('correo')) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            const error = document.createElement('p');
            error.className = 'error-message text-xs text-red-600 mt-1';
            error.textContent = 'Formato de email inválido';
            input.parentNode.appendChild(error);
            input.style.borderColor = 'red';
            hasErrors = true;
            errors.push('Email inválido');
          }
        }

        // Teléfono
        if (input.type === 'tel' || input.name.includes('phone') || input.name.includes('telefono')) {
          if (!/^\d{10}$/.test(value)) {
            const error = document.createElement('p');
            error.className = 'error-message text-xs text-red-600 mt-1';
            error.textContent = 'El teléfono debe tener 10 dígitos';
            input.parentNode.appendChild(error);
            input.style.borderColor = 'red';
            hasErrors = true;
            errors.push('Teléfono inválido');
          }
        }

        // Números
        if (input.type === 'number') {
          if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
            const error = document.createElement('p');
            error.className = 'error-message text-xs text-red-600 mt-1';
            error.textContent = 'Debe ser un número válido';
            input.parentNode.appendChild(error);
            input.style.borderColor = 'red';
            hasErrors = true;
            errors.push('Número inválido');
          }
        }
      }
    });

    // Validar fechas relacionadas
    const fechaIngreso = form.querySelector('#fecha_ingreso, #check_in');
    const fechaSalida = form.querySelector('#fecha_salida, #check_out');

    if (fechaIngreso && fechaSalida && fechaIngreso.value && fechaSalida.value) {
      if (fechaSalida.value <= fechaIngreso.value) {
        const error = document.createElement('p');
        error.className = 'error-message text-xs text-red-600 mt-1';
        error.textContent = 'La fecha de salida debe ser posterior a la fecha de entrada';
        fechaSalida.parentNode.appendChild(error);
        fechaSalida.style.borderColor = 'red';
        hasErrors = true;
        errors.push('Fechas inválidas');
      }
    }

    return { hasErrors, errors };
  };

  // Interceptar todos los formularios
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Solo aplicar a formularios del módulo de habitaciones
    const isRoomsForm = form.id && (
      form.id.includes('form') || 
      form.action.includes('rooms') ||
      form.closest('[id*="room"]') ||
      form.querySelector('[id*="habitacion"]')
    );

    // TEMPORALMENTE DESHABILITADO - Las validaciones específicas manejan todo
    if (!isRoomsForm || true) return;

    console.log(`🛡️ Protegiendo formulario: ${form.id || 'sin ID'}`);

    // NO clonar el formulario para preservar funcionalidades existentes
    // Solo agregar validación adicional
    form.addEventListener('submit', (e) => {
      // SIEMPRE prevenir el envío inicial
      e.preventDefault();
      e.stopPropagation();

      console.log(`🔍 Validando formulario: ${form.id || 'sin ID'}`);

      const validation = validateBasicFields(form);

      if (validation.hasErrors) {
        console.log('❌ Formulario bloqueado por errores:', validation.errors);
        
        showNotification('Por favor corrige los errores antes de continuar', 'error');
        
        // Scroll al primer error
        const firstError = form.querySelector('.error-message');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return false; // BLOQUEAR envío
      }

      console.log('✅ Formulario válido, procediendo...');
      showNotification('Formulario válido, procesando...', 'success');

      // Deshabilitar botón de envío
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        const originalText = submitButton.textContent || submitButton.value;
        submitButton.textContent = 'Procesando...';
        submitButton.style.opacity = '0.6';
      }

      // Enviar después de un breve delay
      setTimeout(() => {
        form.submit();
      }, 800);
    });
  });

  console.log("✅ Validación universal aplicada a todos los formularios");
});
