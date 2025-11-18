// Fix para las validaciones de renta - Mejora la validación existente
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔧 Aplicando fix para validaciones de renta...");

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

  // Mejorar validación de fechas
  const checkInInput = document.getElementById('check_in');
  const checkOutInput = document.getElementById('check_out');

  if (checkInInput) {
    // Limpiar validación anterior y agregar nueva
    const newCheckInInput = checkInInput.cloneNode(true);
    checkInInput.parentNode.replaceChild(newCheckInInput, checkInInput);

    newCheckInInput.addEventListener('change', () => {
      clearFieldErrors(newCheckInInput);
      
      if (!newCheckInInput.value) return;
      
      // Para campos de fecha, ser más permisivo - solo prohibir fechas claramente pasadas
      const selectedDate = newCheckInInput.value; // Formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      console.log('🔧 Validando fecha de entrada:', {
        selectedDate,
        today,
        isBeforeToday: selectedDate < today
      });
      
      // Solo mostrar error si la fecha es claramente anterior a hoy
      if (selectedDate < today) {
        showFieldError(newCheckInInput, 'La fecha de entrada no puede ser anterior a hoy');
        newCheckInInput.style.borderColor = 'red';
      } else {
        newCheckInInput.style.borderColor = '';
        
        // Si hay fecha de salida, validar que sea posterior
        if (checkOutInput && checkOutInput.value) {
          if (checkOutInput.value <= selectedDate) {
            showFieldError(checkOutInput, 'La fecha de salida debe ser posterior a la entrada');
          }
        }
      }
    });

    // Limpiar errores cuando el usuario empiece a escribir
    newCheckInInput.addEventListener('input', () => {
      clearFieldErrors(newCheckInInput);
      newCheckInInput.style.borderColor = '';
    });
  }

  if (checkOutInput) {
    // Limpiar validación anterior y agregar nueva
    const newCheckOutInput = checkOutInput.cloneNode(true);
    checkOutInput.parentNode.replaceChild(newCheckOutInput, checkOutInput);

    newCheckOutInput.addEventListener('change', () => {
      clearFieldErrors(newCheckOutInput);
      
      if (newCheckInInput && newCheckInInput.value) {
        const checkInDateTime = new Date(newCheckInInput.value);
        const checkOutDateTime = new Date(newCheckOutInput.value);
        
        if (checkOutDateTime <= checkInDateTime) {
          showFieldError(newCheckOutInput, 'La fecha de salida debe ser posterior a la entrada');
          newCheckOutInput.style.borderColor = 'red';
        } else {
          newCheckOutInput.style.borderColor = '';
        }
      }
    });

    // Limpiar errores cuando el usuario empiece a escribir
    newCheckOutInput.addEventListener('input', () => {
      clearFieldErrors(newCheckOutInput);
      newCheckOutInput.style.borderColor = '';
    });
  }

  // Mejorar validación de otros campos
  const clientNameInput = document.getElementById('client_name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');

  if (clientNameInput) {
    clientNameInput.addEventListener('input', () => {
      clearFieldErrors(clientNameInput);
      const value = clientNameInput.value;
      
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        showFieldError(clientNameInput, 'Solo se permiten letras y espacios', 'blue');
        clientNameInput.style.borderColor = 'orange';
      } else {
        clientNameInput.style.borderColor = '';
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      clearFieldErrors(emailInput);
      const value = emailInput.value;
      
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        showFieldError(emailInput, 'Formato de email inválido', 'blue');
        emailInput.style.borderColor = 'orange';
      } else {
        emailInput.style.borderColor = '';
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      clearFieldErrors(phoneInput);
      
      // Permitir solo números
      let value = phoneInput.value.replace(/[^0-9]/g, '');
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
      phoneInput.value = value;
      
      if (value.length > 0 && value.length !== 10) {
        showFieldError(phoneInput, 'El teléfono debe tener 10 dígitos', 'blue');
        phoneInput.style.borderColor = 'orange';
      } else {
        phoneInput.style.borderColor = '';
      }
    });
  }

  // Interceptar el envío del formulario para validar
  const form = document.getElementById('formRent');
  if (form) {
    form.addEventListener('submit', (e) => {
      let hasErrors = false;

      // Validar campos requeridos
      const requiredFields = [
        { element: document.getElementById('client_name'), name: 'Nombre del cliente' },
        { element: document.getElementById('email'), name: 'Email' },
        { element: document.getElementById('phone'), name: 'Teléfono' },
        { element: document.getElementById('check_in'), name: 'Fecha de entrada' },
        { element: document.getElementById('check_out'), name: 'Fecha de salida' },
        { element: document.getElementById('payment_type'), name: 'Tipo de pago' }
      ];

      requiredFields.forEach(field => {
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

      // Validar fechas
      const checkIn = document.getElementById('check_in');
      const checkOut = document.getElementById('check_out');
      
      if (checkIn && checkIn.value) {
        // Comparación simple de strings de fecha (YYYY-MM-DD)
        const selectedDate = checkIn.value;
        const today = new Date().toISOString().split('T')[0];
        
        // Solo mostrar error si la fecha es claramente anterior a hoy
        if (selectedDate < today) {
          showFieldError(checkIn, 'La fecha de entrada no puede ser anterior a hoy');
          checkIn.style.borderColor = 'red';
          hasErrors = true;
        }
      }

      if (checkIn && checkOut && checkIn.value && checkOut.value) {
        const checkInDate = new Date(checkIn.value);
        const checkOutDate = new Date(checkOut.value);
        
        if (checkOutDate <= checkInDate) {
          showFieldError(checkOut, 'La fecha de salida debe ser posterior a la entrada');
          checkOut.style.borderColor = 'red';
          hasErrors = true;
        }
      }

      if (hasErrors) {
        e.preventDefault();
        e.stopPropagation();
        
        // Scroll al primer error
        const firstError = document.querySelector('.error-message');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        console.log('❌ Formulario tiene errores, envío cancelado');
        return false;
      }

      console.log('✅ Formulario válido, procediendo con el envío');
    });
  }

  console.log("✅ Fix de validaciones de renta aplicado correctamente");
});
