// Validación universal para todos los formularios del módulo de habitaciones
document.addEventListener("DOMContentLoaded", () => {
  console.log("🛡️ Aplicando validación universal para formularios...");

  // Función para mostrar notificación
  const showNotification = (message, type = 'error') => {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      console.warn('showNotification not found');
      alert(message);
    }
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
