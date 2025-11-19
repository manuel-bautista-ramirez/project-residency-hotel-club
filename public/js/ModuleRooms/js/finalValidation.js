// Validación final que NO interfiere con las funciones existentes
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎯 Aplicando validación final sin interferir...");

  // Función para mostrar error específico
  const showFieldError = (element, message) => {
    if (!element) return;
    
    // Limpiar errores previos de este campo
    const existingError = element.parentNode.querySelector('.final-error');
    if (existingError) {
      existingError.remove();
    }

    // Poner borde rojo
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';

    // Crear mensaje de error
    const error = document.createElement('p');
    error.className = 'final-error text-xs text-red-600 mt-1';
    error.textContent = message;
    element.parentNode.appendChild(error);
  };

  // Función para limpiar error de un campo
  const clearFieldError = (element) => {
    if (!element) return;
    element.style.borderColor = '';
    element.style.borderWidth = '';
    const existingError = element.parentNode.querySelector('.final-error');
    if (existingError) {
      existingError.remove();
    }
  };

  // Validación para formulario de rentas - SIN CLONAR
  const rentForm = document.getElementById('formRent');
  if (rentForm) {
    // Agregar event listener con alta prioridad
    rentForm.addEventListener('submit', (e) => {
      console.log('🎯 VALIDACIÓN FINAL - Interceptando envío de renta');
      
      // Limpiar todos los errores previos
      document.querySelectorAll('.final-error').forEach(error => error.remove());
      
      let hasErrors = false;
      let errorMessages = [];

      // Validar campos críticos
      const clientName = document.getElementById('client_name');
      if (!clientName || !clientName.value.trim()) {
        showFieldError(clientName, 'Nombre requerido');
        errorMessages.push('Nombre del cliente');
        hasErrors = true;
      }

      const email = document.getElementById('email');
      if (!email || !email.value.trim()) {
        showFieldError(email, 'Email requerido');
        errorMessages.push('Email');
        hasErrors = true;
      }

      const phone = document.getElementById('phone');
      if (!phone || !phone.value.trim()) {
        showFieldError(phone, 'Teléfono requerido');
        errorMessages.push('Teléfono');
        hasErrors = true;
      }

      const checkIn = document.getElementById('check_in');
      if (!checkIn || !checkIn.value) {
        showFieldError(checkIn, 'Fecha de entrada requerida');
        errorMessages.push('Fecha de entrada');
        hasErrors = true;
      }

      const checkOut = document.getElementById('check_out');
      if (!checkOut || !checkOut.value) {
        showFieldError(checkOut, 'Fecha de salida requerida');
        errorMessages.push('Fecha de salida');
        hasErrors = true;
      }

      const paymentType = document.getElementById('payment_type');
      if (!paymentType || !paymentType.value) {
        showFieldError(paymentType, 'Tipo de pago requerido');
        errorMessages.push('Tipo de pago');
        hasErrors = true;
      }

      // Si hay errores, BLOQUEAR completamente
      if (hasErrors) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('❌ ENVÍO BLOQUEADO - Campos faltantes:', errorMessages);
        
        // Mostrar alerta
        alert(`Por favor completa los siguientes campos:\n• ${errorMessages.join('\n• ')}`);
        
        // Enfocar primer campo con error
        const firstErrorField = document.querySelector('.final-error');
        if (firstErrorField && firstErrorField.previousElementSibling) {
          firstErrorField.previousElementSibling.focus();
        }
        
        return false;
      }

      console.log('✅ Todos los campos completos - Permitiendo envío');
      // Si no hay errores, permitir que el envío continúe normalmente
    }, true); // true = captura en fase de captura (alta prioridad)

    console.log('🎯 Validación aplicada al formulario de rentas');
  }

  // Validación para formulario de reservaciones - SIN CLONAR
  const reserveForm = document.getElementById('formReserve');
  if (reserveForm) {
    reserveForm.addEventListener('submit', (e) => {
      console.log('🎯 VALIDACIÓN FINAL - Interceptando envío de reservación');
      
      // Limpiar todos los errores previos
      document.querySelectorAll('.final-error').forEach(error => error.remove());
      
      let hasErrors = false;
      let errorMessages = [];

      // Validar campos críticos
      const clientName = document.getElementById('nombre_cliente');
      if (!clientName || !clientName.value.trim()) {
        showFieldError(clientName, 'Nombre requerido');
        errorMessages.push('Nombre del cliente');
        hasErrors = true;
      }

      const correo = document.getElementById('correo');
      if (!correo || !correo.value.trim()) {
        showFieldError(correo, 'Correo requerido');
        errorMessages.push('Correo');
        hasErrors = true;
      }

      const telefono = document.getElementById('telefono');
      if (!telefono || !telefono.value.trim()) {
        showFieldError(telefono, 'Teléfono requerido');
        errorMessages.push('Teléfono');
        hasErrors = true;
      }

      const fechaIngreso = document.getElementById('fecha_ingreso');
      if (!fechaIngreso || !fechaIngreso.value) {
        showFieldError(fechaIngreso, 'Fecha de ingreso requerida');
        errorMessages.push('Fecha de ingreso');
        hasErrors = true;
      }

      const fechaSalida = document.getElementById('fecha_salida');
      if (!fechaSalida || !fechaSalida.value) {
        showFieldError(fechaSalida, 'Fecha de salida requerida');
        errorMessages.push('Fecha de salida');
        hasErrors = true;
      }

      // Si hay errores, BLOQUEAR completamente
      if (hasErrors) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('❌ ENVÍO BLOQUEADO - Campos faltantes:', errorMessages);
        
        // Mostrar alerta
        alert(`Por favor completa los siguientes campos:\n• ${errorMessages.join('\n• ')}`);
        
        // Enfocar primer campo con error
        const firstErrorField = document.querySelector('.final-error');
        if (firstErrorField && firstErrorField.previousElementSibling) {
          firstErrorField.previousElementSibling.focus();
        }
        
        return false;
      }

      console.log('✅ Todos los campos completos - Permitiendo envío');
      // Si no hay errores, permitir que el envío continúe normalmente
    }, true); // true = captura en fase de captura (alta prioridad)

    console.log('🎯 Validación aplicada al formulario de reservaciones');
  }

  // Validación para formulario de EDITAR reservación - SIN CLONAR
  const editReservationForm = document.getElementById('formEditReservation');
  if (editReservationForm) {
    editReservationForm.addEventListener('submit', (e) => {
      console.log('🎯 VALIDACIÓN FINAL - Interceptando envío de editar reservación');
      
      // Limpiar todos los errores previos
      document.querySelectorAll('.final-error').forEach(error => error.remove());
      
      let hasErrors = false;
      let errorMessages = [];

      // Validar campos críticos
      const nombreCliente = document.getElementById('nombre_cliente');
      if (!nombreCliente || !nombreCliente.value.trim()) {
        showFieldError(nombreCliente, 'Nombre requerido');
        errorMessages.push('Nombre del cliente');
        hasErrors = true;
      }

      const habitacionId = document.getElementById('habitacion_id');
      if (!habitacionId || !habitacionId.value) {
        showFieldError(habitacionId, 'Habitación requerida');
        errorMessages.push('Habitación');
        hasErrors = true;
      }

      const fechaIngreso = document.getElementById('fecha_ingreso');
      if (!fechaIngreso || !fechaIngreso.value) {
        showFieldError(fechaIngreso, 'Fecha de ingreso requerida');
        errorMessages.push('Fecha de ingreso');
        hasErrors = true;
      }

      const fechaSalida = document.getElementById('fecha_salida');
      if (!fechaSalida || !fechaSalida.value) {
        showFieldError(fechaSalida, 'Fecha de salida requerida');
        errorMessages.push('Fecha de salida');
        hasErrors = true;
      }

      const monto = document.getElementById('monto');
      if (!monto || !monto.value || parseFloat(monto.value) <= 0) {
        showFieldError(monto, 'Monto requerido');
        errorMessages.push('Monto');
        hasErrors = true;
      }

      // Si hay errores, BLOQUEAR completamente
      if (hasErrors) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('❌ ENVÍO BLOQUEADO - Campos faltantes:', errorMessages);
        
        // Mostrar alerta
        alert(`Por favor completa los siguientes campos:\n• ${errorMessages.join('\n• ')}`);
        
        // Enfocar primer campo con error
        const firstErrorField = document.querySelector('.final-error');
        if (firstErrorField && firstErrorField.previousElementSibling) {
          firstErrorField.previousElementSibling.focus();
        }
        
        return false;
      }

      console.log('✅ Todos los campos completos - Permitiendo envío');
      // Si no hay errores, permitir que el envío continúe normalmente
    }, true); // true = captura en fase de captura (alta prioridad)

    console.log('🎯 Validación aplicada al formulario de EDITAR reservación');
  }

  // Limpiar errores cuando el usuario empiece a escribir
  document.addEventListener('input', (e) => {
    if (e.target.matches('input, select, textarea')) {
      clearFieldError(e.target);
    }
  });

  console.log("✅ Validación final aplicada - NO interfiere con funciones existentes");
});
