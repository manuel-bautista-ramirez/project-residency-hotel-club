// Fix para las validaciones de reservaciones - Compatible con el código existente
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔧 Aplicando fix para validaciones de reservaciones...");

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

  // Función para agregar tiempo a fecha (compatible con el código existente)
  const addTimeToDate = (dateStr, isCheckOut = false) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isCheckOut) {
      date.setHours(11, 59, 0, 0);
    } else {
      date.setHours(18, 0, 0, 0);
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Mejorar validación de campos
  const nombreInput = document.getElementById('nombre_cliente');
  const correoInput = document.getElementById('correo');
  const telefonoInput = document.getElementById('telefono');
  const fechaIngresoInput = document.getElementById('fecha_ingreso');
  const fechaSalidaInput = document.getElementById('fecha_salida');
  const engancheInput = document.getElementById('enganche');

  // Validación en tiempo real para nombre
  if (nombreInput) {
    nombreInput.addEventListener('input', () => {
      clearFieldErrors(nombreInput);
      const value = nombreInput.value;
      
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        showFieldError(nombreInput, 'Solo se permiten letras y espacios', 'blue');
        nombreInput.style.borderColor = 'orange';
      } else {
        nombreInput.style.borderColor = '';
      }
    });
  }

  // Validación en tiempo real para correo
  if (correoInput) {
    correoInput.addEventListener('input', () => {
      clearFieldErrors(correoInput);
      const value = correoInput.value;
      
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        showFieldError(correoInput, 'Formato de correo inválido', 'blue');
        correoInput.style.borderColor = 'orange';
      } else {
        correoInput.style.borderColor = '';
      }
    });
  }

  // Validación en tiempo real para teléfono
  if (telefonoInput) {
    telefonoInput.addEventListener('input', () => {
      clearFieldErrors(telefonoInput);
      
      // Permitir solo números
      let value = telefonoInput.value.replace(/[^0-9]/g, '');
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      telefonoInput.value = value;
      
      if (value.length > 0 && value.length !== 10) {
        showFieldError(telefonoInput, 'El teléfono debe tener 10 dígitos', 'blue');
        telefonoInput.style.borderColor = 'orange';
      } else {
        telefonoInput.style.borderColor = '';
      }
    });
  }

  // Validación para fechas
  if (fechaIngresoInput) {
    fechaIngresoInput.addEventListener('change', () => {
      clearFieldErrors(fechaIngresoInput);
      
      const selectedDate = new Date(fechaIngresoInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        showFieldError(fechaIngresoInput, 'La fecha de ingreso no puede ser anterior a hoy');
        fechaIngresoInput.style.borderColor = 'red';
      } else {
        fechaIngresoInput.style.borderColor = '';
      }
    });

    // Limpiar errores cuando el usuario empiece a escribir
    fechaIngresoInput.addEventListener('input', () => {
      clearFieldErrors(fechaIngresoInput);
      fechaIngresoInput.style.borderColor = '';
    });
  }

  if (fechaSalidaInput) {
    fechaSalidaInput.addEventListener('change', () => {
      clearFieldErrors(fechaSalidaInput);
      
      if (fechaIngresoInput && fechaIngresoInput.value) {
        const fechaIngreso = new Date(fechaIngresoInput.value);
        const fechaSalida = new Date(fechaSalidaInput.value);
        
        if (fechaSalida <= fechaIngreso) {
          showFieldError(fechaSalidaInput, 'La fecha de salida debe ser posterior a la fecha de ingreso');
          fechaSalidaInput.style.borderColor = 'red';
        } else {
          fechaSalidaInput.style.borderColor = '';
        }
      }
    });

    // Limpiar errores cuando el usuario empiece a escribir
    fechaSalidaInput.addEventListener('input', () => {
      clearFieldErrors(fechaSalidaInput);
      fechaSalidaInput.style.borderColor = '';
    });
  }

  // Validación para enganche
  if (engancheInput) {
    engancheInput.addEventListener('input', () => {
      clearFieldErrors(engancheInput);
      
      const value = engancheInput.value;
      // Permitir solo números y un punto decimal
      const cleanValue = value.replace(/[^0-9.]/g, '');
      
      // Asegurar solo un punto decimal
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        engancheInput.value = parts[0] + '.' + parts.slice(1).join('');
      } else {
        engancheInput.value = cleanValue;
      }
    });
  }

  // Interceptar el envío del formulario
  const form = document.getElementById('formReserve');
  if (form) {
    // NO clonar para preservar funcionalidades existentes
    // Agregar validación adicional con prioridad alta
    form.addEventListener('submit', async (e) => {
      // SIEMPRE prevenir el envío inicial para validar
      e.preventDefault();
      e.stopPropagation();

      console.log('🔧 Fix de validación interceptando envío del formulario');

      let hasErrors = false;

      // Limpiar errores previos
      document.querySelectorAll('.error-message').forEach(error => error.remove());
      const allInputs = document.querySelectorAll('input, select');
      allInputs.forEach(input => {
        input.style.borderColor = '';
      });

      // Validar solo campos críticos (más permisivo)
      const criticalFields = [
        { element: document.getElementById('nombre_cliente'), name: 'Nombre del cliente' },
        { element: document.getElementById('fecha_ingreso'), name: 'Fecha de ingreso' },
        { element: document.getElementById('fecha_salida'), name: 'Fecha de salida' }
      ];

      criticalFields.forEach(field => {
        if (field.element && !field.element.value.trim()) {
          showFieldError(field.element, `${field.name} es requerido`);
          field.element.style.borderColor = 'red';
          hasErrors = true;
        }
      });

      // Validar formato de correo
      const correo = document.getElementById('correo');
      if (correo && correo.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value)) {
        showFieldError(correo, 'Formato de correo inválido');
        correo.style.borderColor = 'red';
        hasErrors = true;
      }

      // Validar teléfono
      const telefono = document.getElementById('telefono');
      if (telefono && telefono.value && telefono.value.length !== 10) {
        showFieldError(telefono, 'El teléfono debe tener 10 dígitos');
        telefono.style.borderColor = 'red';
        hasErrors = true;
      }

      // Validar fechas
      const fechaIngreso = document.getElementById('fecha_ingreso');
      const fechaSalida = document.getElementById('fecha_salida');
      
      if (fechaIngreso && fechaIngreso.value) {
        const selectedDate = new Date(fechaIngreso.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          showFieldError(fechaIngreso, 'La fecha de ingreso no puede ser anterior a hoy');
          fechaIngreso.style.borderColor = 'red';
          hasErrors = true;
        }
      }

      if (fechaIngreso && fechaSalida && fechaIngreso.value && fechaSalida.value) {
        const fechaIngresoDate = new Date(fechaIngreso.value);
        const fechaSalidaDate = new Date(fechaSalida.value);
        
        if (fechaSalidaDate <= fechaIngresoDate) {
          showFieldError(fechaSalida, 'La fecha de salida debe ser posterior a la fecha de ingreso');
          fechaSalida.style.borderColor = 'red';
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
          <span class="text-sm font-medium">Formulario válido, creando reservación...</span>
        </div>
      `;
      document.body.appendChild(successNotification);

      // Aplicar la lógica de fechas existente
      const checkInInput = document.getElementById('fecha_ingreso');
      const checkOutInput = document.getElementById('fecha_salida');

      if (checkInInput && checkOutInput) {
        const checkInWithTime = addTimeToDate(checkInInput.value);
        const checkOutWithTime = addTimeToDate(checkOutInput.value, true);

        console.log('Enviando fechas con hora:');
        console.log('fecha_ingreso:', checkInWithTime);
        console.log('fecha_salida:', checkOutWithTime);

        const hiddenCheckIn = document.getElementById('fecha_ingreso_with_time');
        const hiddenCheckOut = document.getElementById('fecha_salida_with_time');

        if (hiddenCheckIn) hiddenCheckIn.value = checkInWithTime;
        if (hiddenCheckOut) hiddenCheckOut.value = checkOutWithTime;
      }

      // Mostrar loading
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        submitButton.textContent = 'Creando reservación...';
      }

      const overlay = document.getElementById('loadingOverlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) loadingMsg.textContent = 'Creando reservación...';
      }

      // Enviar el formulario programáticamente después de un breve delay
      setTimeout(() => {
        form.submit();
      }, 500);
    });
  }

  console.log("✅ Fix de validaciones de reservaciones aplicado correctamente");
});
