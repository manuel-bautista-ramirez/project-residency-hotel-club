// Validación simple: solo campos vacíos en rojo con mensaje específico
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔴 Aplicando validación simple - solo campos vacíos...");

  // Función para mostrar error específico
  const showFieldError = (element, message) => {
    // Limpiar errores previos de este campo
    const existingError = element.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Poner borde rojo
    element.style.borderColor = 'red';
    element.style.borderWidth = '2px';

    // Crear mensaje de error
    const error = document.createElement('p');
    error.className = 'field-error text-xs text-red-600 mt-1';
    error.textContent = message;
    element.parentNode.appendChild(error);
  };

  // Función para limpiar error de un campo
  const clearFieldError = (element) => {
    element.style.borderColor = '';
    element.style.borderWidth = '';
    const existingError = element.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  };

  // Validación para formulario de rentas
  const rentForm = document.getElementById('formRent');
  if (rentForm) {
    // Remover todos los event listeners existentes clonando el formulario
    const newRentForm = rentForm.cloneNode(true);
    rentForm.parentNode.replaceChild(newRentForm, rentForm);
    
    newRentForm.addEventListener('submit', (e) => {
      e.preventDefault(); // SIEMPRE bloquear primero
      e.stopPropagation(); // Evitar que otros listeners se ejecuten
      e.stopImmediatePropagation(); // Bloquear completamente
      
      console.log('🚨 EVENT LISTENER EJECUTÁNDOSE - FORMULARIO DE RENTA');
      console.log('🔴 Validando formulario de renta...');
      console.log('🛑 ENVÍO BLOQUEADO INICIALMENTE');
      
      // Limpiar todos los errores previos
      document.querySelectorAll('.field-error').forEach(error => error.remove());
      document.querySelectorAll('input, select').forEach(input => {
        input.style.borderColor = '';
        input.style.borderWidth = '';
      });

      let hasErrors = false;

      // Validar cada campo específicamente
      const clientName = document.getElementById('client_name');
      console.log('🔍 Validando client_name:', clientName ? clientName.value : 'NO ENCONTRADO');
      if (!clientName || !clientName.value.trim()) {
        console.log('❌ client_name está vacío');
        showFieldError(clientName, 'El nombre del cliente está vacío');
        hasErrors = true;
      }

      const email = document.getElementById('email');
      if (!email || !email.value.trim()) {
        showFieldError(email, 'El email está vacío');
        hasErrors = true;
      }

      const phone = document.getElementById('phone');
      if (!phone || !phone.value.trim()) {
        showFieldError(phone, 'El teléfono está vacío');
        hasErrors = true;
      }

      const checkIn = document.getElementById('check_in');
      if (!checkIn || !checkIn.value) {
        showFieldError(checkIn, 'La fecha de entrada está vacía');
        hasErrors = true;
      }

      const checkOut = document.getElementById('check_out');
      if (!checkOut || !checkOut.value) {
        showFieldError(checkOut, 'La fecha de salida está vacía');
        hasErrors = true;
      }

      const paymentType = document.getElementById('payment_type');
      console.log('🔍 Validando payment_type:', paymentType ? paymentType.value : 'NO ENCONTRADO');
      if (!paymentType || !paymentType.value) {
        console.log('❌ payment_type está vacío');
        showFieldError(paymentType, 'El tipo de pago está vacío');
        hasErrors = true;
      }

      // Si hay errores, NO enviar y mantener en la misma página
      if (hasErrors) {
        console.log('❌ FORMULARIO DE RENTA COMPLETAMENTE BLOQUEADO - hay campos vacíos');
        console.log('🔒 Manteniendo en la misma URL - NO redirigir');
        console.log('🚫 DETENIENDO EJECUCIÓN - NO SE ENVIARÁ EL FORMULARIO DE RENTA');
        
        // Enfocar el primer campo con error
        const firstErrorField = document.querySelector('input[style*="border-color: red"], select[style*="border-color: red"]');
        if (firstErrorField) {
          firstErrorField.focus();
        }
        
        // BLOQUEO TOTAL - NO hacer nada más
        return false;
      }

      // Si no hay errores, enviar normalmente
      console.log('✅ Formulario de renta válido, enviando...');
      newRentForm.submit();
    });

    console.log('🔴 Validación aplicada al formulario de rentas');
  }

  // Validación para formulario de reservaciones
  const reserveForm = document.getElementById('formReserve');
  if (reserveForm) {
    // Remover todos los event listeners existentes clonando el formulario
    const newReserveForm = reserveForm.cloneNode(true);
    reserveForm.parentNode.replaceChild(newReserveForm, reserveForm);
    
    newReserveForm.addEventListener('submit', (e) => {
      e.preventDefault(); // SIEMPRE bloquear primero
      e.stopPropagation(); // Evitar que otros listeners se ejecuten
      e.stopImmediatePropagation(); // Bloquear completamente
      
      console.log('🔴 Validando formulario de reservación...');
      
      // Limpiar todos los errores previos
      document.querySelectorAll('.field-error').forEach(error => error.remove());
      document.querySelectorAll('input, select').forEach(input => {
        input.style.borderColor = '';
        input.style.borderWidth = '';
      });

      let hasErrors = false;

      // Validar cada campo específicamente
      const clientName = document.getElementById('nombre_cliente');
      if (!clientName || !clientName.value.trim()) {
        showFieldError(clientName, 'El nombre del cliente está vacío');
        hasErrors = true;
      }

      const correo = document.getElementById('correo');
      if (!correo || !correo.value.trim()) {
        showFieldError(correo, 'El correo está vacío');
        hasErrors = true;
      }

      const telefono = document.getElementById('telefono');
      if (!telefono || !telefono.value.trim()) {
        showFieldError(telefono, 'El teléfono está vacío');
        hasErrors = true;
      }

      const fechaIngreso = document.getElementById('fecha_ingreso');
      if (!fechaIngreso || !fechaIngreso.value) {
        showFieldError(fechaIngreso, 'La fecha de ingreso está vacía');
        hasErrors = true;
      }

      const fechaSalida = document.getElementById('fecha_salida');
      if (!fechaSalida || !fechaSalida.value) {
        showFieldError(fechaSalida, 'La fecha de salida está vacía');
        hasErrors = true;
      }

      // Si hay errores, NO enviar y mantener en la misma página
      if (hasErrors) {
        console.log('❌ Formulario BLOQUEADO - hay campos vacíos');
        console.log('🔒 Manteniendo en la misma URL - NO redirigir');
        
        // Enfocar el primer campo con error
        const firstErrorField = document.querySelector('input[style*="border-color: red"], select[style*="border-color: red"]');
        if (firstErrorField) {
          firstErrorField.focus();
        }
        
        // NO hacer nada más - mantener en la misma página
        return false;
      }

      // Si no hay errores, enviar normalmente
      console.log('✅ Formulario válido, enviando...');
      newReserveForm.submit();
    });

    console.log('🔴 Validación aplicada al formulario de reservaciones');
  }

  // Limpiar errores cuando el usuario empiece a escribir
  document.addEventListener('input', (e) => {
    if (e.target.matches('input, select, textarea')) {
      clearFieldError(e.target);
    }
  });

  console.log("✅ Validación simple aplicada - solo campos vacíos en rojo");
});
