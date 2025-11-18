// Validación en tiempo real con mensajes específicos
document.addEventListener("DOMContentLoaded", () => {
  console.log("⚡ Aplicando validación en tiempo real...");

  // Función para mostrar mensaje de ayuda específico
  const showHelpMessage = (element, message, type = 'info') => {
    if (!element) return;
    
    // Limpiar mensajes previos
    const existingHelp = element.parentNode.querySelector('.help-message');
    if (existingHelp) {
      existingHelp.remove();
    }

    // Crear mensaje de ayuda
    const helpDiv = document.createElement('div');
    helpDiv.className = 'help-message text-xs mt-1 px-2 py-1 rounded';
    
    if (type === 'error') {
      helpDiv.className += ' bg-red-50 text-red-700 border border-red-200';
      element.style.borderColor = '#ef4444';
    } else if (type === 'success') {
      helpDiv.className += ' bg-green-50 text-green-700 border border-green-200';
      element.style.borderColor = '#22c55e';
    } else {
      helpDiv.className += ' bg-blue-50 text-blue-700 border border-blue-200';
      element.style.borderColor = '#3b82f6';
    }
    
    helpDiv.textContent = message;
    element.parentNode.appendChild(helpDiv);
  };

  // Función para limpiar mensaje de ayuda
  const clearHelpMessage = (element) => {
    if (!element) return;
    const existingHelp = element.parentNode.querySelector('.help-message');
    if (existingHelp) {
      existingHelp.remove();
    }
    element.style.borderColor = '';
  };

  // Validación para formulario de rentas
  const rentForm = document.getElementById('formRent');
  if (rentForm) {
    
    // Validación del nombre del cliente
    const clientName = document.getElementById('client_name');
    if (clientName) {
      clientName.addEventListener('focus', () => {
        if (!clientName.value.trim()) {
          showHelpMessage(clientName, 'Ingresa el nombre completo del cliente', 'info');
        }
      });

      clientName.addEventListener('input', () => {
        // Filtrar caracteres no válidos en tiempo real
        const originalValue = clientName.value;
        const filteredValue = originalValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        
        if (originalValue !== filteredValue) {
          clientName.value = filteredValue;
          showHelpMessage(clientName, 'Solo se permiten letras y espacios en el nombre', 'error');
          return;
        }
        
        const value = clientName.value.trim();
        
        // Regex para solo letras, espacios y acentos (nombres válidos)
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        
        if (!value) {
          showHelpMessage(clientName, 'El nombre del cliente es requerido', 'error');
        } else if (value.length < 3) {
          showHelpMessage(clientName, 'El nombre debe tener al menos 3 caracteres', 'error');
        } else if (!nameRegex.test(value)) {
          showHelpMessage(clientName, 'El nombre solo puede contener letras y espacios', 'error');
        } else if (value.length > 50) {
          showHelpMessage(clientName, 'El nombre es demasiado largo (máximo 50 caracteres)', 'error');
        } else {
          showHelpMessage(clientName, '✓ Nombre válido', 'success');
        }
      });

      clientName.addEventListener('blur', () => {
        if (clientName.value.trim()) {
          clearHelpMessage(clientName);
        }
      });
    }

    // Validación del email
    const email = document.getElementById('email');
    if (email) {
      email.addEventListener('focus', () => {
        if (!email.value.trim()) {
          showHelpMessage(email, 'Ingresa un email válido (ejemplo@correo.com)', 'info');
        }
      });

      email.addEventListener('input', () => {
        const value = email.value.trim();
        if (!value) {
          showHelpMessage(email, 'El email es requerido', 'error');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          showHelpMessage(email, 'Formato de email inválido (debe contener @ y dominio)', 'error');
        } else {
          showHelpMessage(email, '✓ Email válido', 'success');
        }
      });

      email.addEventListener('blur', () => {
        if (email.value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
          clearHelpMessage(email);
        }
      });
    }

    // Validación del teléfono
    const phone = document.getElementById('phone');
    if (phone) {
      phone.addEventListener('focus', () => {
        if (!phone.value.trim()) {
          showHelpMessage(phone, 'Ingresa un teléfono de 10 dígitos', 'info');
        }
      });

      phone.addEventListener('input', () => {
        const value = phone.value.replace(/\D/g, ''); // Solo números
        phone.value = value; // Actualizar el campo solo con números
        
        if (!value) {
          showHelpMessage(phone, 'El teléfono es requerido', 'error');
        } else if (value.length < 10) {
          showHelpMessage(phone, `Faltan ${10 - value.length} dígitos (${value.length}/10)`, 'error');
        } else if (value.length === 10) {
          showHelpMessage(phone, '✓ Teléfono válido', 'success');
        } else {
          showHelpMessage(phone, 'Máximo 10 dígitos', 'error');
          phone.value = value.slice(0, 10);
        }
      });

      phone.addEventListener('blur', () => {
        if (phone.value.length === 10) {
          clearHelpMessage(phone);
        }
      });
    }

    // Validación de fecha de entrada
    const checkIn = document.getElementById('check_in');
    if (checkIn) {
      checkIn.addEventListener('focus', () => {
        if (!checkIn.value) {
          showHelpMessage(checkIn, 'Selecciona la fecha de entrada', 'info');
        }
      });

      checkIn.addEventListener('change', () => {
        if (!checkIn.value) {
          showHelpMessage(checkIn, 'La fecha de entrada es requerida', 'error');
        } else {
          showHelpMessage(checkIn, '✓ Fecha de entrada seleccionada', 'success');
          
          // Validar con fecha de salida si existe
          const checkOut = document.getElementById('check_out');
          if (checkOut && checkOut.value) {
            if (checkOut.value <= checkIn.value) {
              showHelpMessage(checkOut, 'La fecha de salida debe ser posterior a la entrada', 'error');
            }
          }
        }
      });

      checkIn.addEventListener('blur', () => {
        if (checkIn.value) {
          clearHelpMessage(checkIn);
        }
      });
    }

    // Validación de fecha de salida
    const checkOut = document.getElementById('check_out');
    if (checkOut) {
      checkOut.addEventListener('focus', () => {
        if (!checkOut.value) {
          showHelpMessage(checkOut, 'Selecciona la fecha de salida', 'info');
        }
      });

      checkOut.addEventListener('change', () => {
        const checkInValue = document.getElementById('check_in')?.value;
        
        if (!checkOut.value) {
          showHelpMessage(checkOut, 'La fecha de salida es requerida', 'error');
        } else if (checkInValue && checkOut.value <= checkInValue) {
          showHelpMessage(checkOut, 'La fecha de salida debe ser posterior a la entrada', 'error');
        } else {
          showHelpMessage(checkOut, '✓ Fecha de salida válida', 'success');
        }
      });

      checkOut.addEventListener('blur', () => {
        const checkInValue = document.getElementById('check_in')?.value;
        if (checkOut.value && checkInValue && checkOut.value > checkInValue) {
          clearHelpMessage(checkOut);
        }
      });
    }

    // Validación del tipo de pago
    const paymentType = document.getElementById('payment_type');
    if (paymentType) {
      paymentType.addEventListener('focus', () => {
        if (!paymentType.value) {
          showHelpMessage(paymentType, 'Selecciona el método de pago', 'info');
        }
      });

      paymentType.addEventListener('change', () => {
        if (!paymentType.value) {
          showHelpMessage(paymentType, 'El tipo de pago es requerido', 'error');
        } else {
          showHelpMessage(paymentType, `✓ Método seleccionado: ${paymentType.options[paymentType.selectedIndex].text}`, 'success');
        }
      });

      paymentType.addEventListener('blur', () => {
        if (paymentType.value) {
          clearHelpMessage(paymentType);
        }
      });
    }

    console.log('⚡ Validación en tiempo real aplicada al formulario de rentas');
  }

  // Validación para formulario de reservaciones
  const reserveForm = document.getElementById('formReserve');
  if (reserveForm) {
    
    // Validación del nombre del cliente (reservaciones)
    const nombreCliente = document.getElementById('nombre_cliente');
    if (nombreCliente) {
      nombreCliente.addEventListener('focus', () => {
        if (!nombreCliente.value.trim()) {
          showHelpMessage(nombreCliente, 'Ingresa el nombre completo del cliente', 'info');
        }
      });

      nombreCliente.addEventListener('input', () => {
        // Filtrar caracteres no válidos en tiempo real
        const originalValue = nombreCliente.value;
        const filteredValue = originalValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        
        if (originalValue !== filteredValue) {
          nombreCliente.value = filteredValue;
          showHelpMessage(nombreCliente, 'Solo se permiten letras y espacios en el nombre', 'error');
          return;
        }
        
        const value = nombreCliente.value.trim();
        
        // Regex para solo letras, espacios y acentos (nombres válidos)
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        
        if (!value) {
          showHelpMessage(nombreCliente, 'El nombre del cliente es requerido', 'error');
        } else if (value.length < 3) {
          showHelpMessage(nombreCliente, 'El nombre debe tener al menos 3 caracteres', 'error');
        } else if (!nameRegex.test(value)) {
          showHelpMessage(nombreCliente, 'El nombre solo puede contener letras y espacios', 'error');
        } else if (value.length > 50) {
          showHelpMessage(nombreCliente, 'El nombre es demasiado largo (máximo 50 caracteres)', 'error');
        } else {
          showHelpMessage(nombreCliente, '✓ Nombre válido', 'success');
        }
      });

      nombreCliente.addEventListener('blur', () => {
        if (nombreCliente.value.trim()) {
          clearHelpMessage(nombreCliente);
        }
      });
    }

    // Validación del correo (reservaciones)
    const correo = document.getElementById('correo');
    if (correo) {
      correo.addEventListener('focus', () => {
        if (!correo.value.trim()) {
          showHelpMessage(correo, 'Ingresa un correo válido (ejemplo@correo.com)', 'info');
        }
      });

      correo.addEventListener('input', () => {
        const value = correo.value.trim();
        if (!value) {
          showHelpMessage(correo, 'El correo es requerido', 'error');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          showHelpMessage(correo, 'Formato de correo inválido (debe contener @ y dominio)', 'error');
        } else {
          showHelpMessage(correo, '✓ Correo válido', 'success');
        }
      });

      correo.addEventListener('blur', () => {
        if (correo.value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value)) {
          clearHelpMessage(correo);
        }
      });
    }

    // Validación del teléfono (reservaciones)
    const telefono = document.getElementById('telefono');
    if (telefono) {
      telefono.addEventListener('focus', () => {
        if (!telefono.value.trim()) {
          showHelpMessage(telefono, 'Ingresa un teléfono de 10 dígitos', 'info');
        }
      });

      telefono.addEventListener('input', () => {
        const value = telefono.value.replace(/\D/g, ''); // Solo números
        telefono.value = value; // Actualizar el campo solo con números
        
        if (!value) {
          showHelpMessage(telefono, 'El teléfono es requerido', 'error');
        } else if (value.length < 10) {
          showHelpMessage(telefono, `Faltan ${10 - value.length} dígitos (${value.length}/10)`, 'error');
        } else if (value.length === 10) {
          showHelpMessage(telefono, '✓ Teléfono válido', 'success');
        } else {
          showHelpMessage(telefono, 'Máximo 10 dígitos', 'error');
          telefono.value = value.slice(0, 10);
        }
      });

      telefono.addEventListener('blur', () => {
        if (telefono.value.length === 10) {
          clearHelpMessage(telefono);
        }
      });
    }

    console.log('⚡ Validación en tiempo real aplicada al formulario de reservaciones');
  }

  // Validación para formulario de EDITAR reservación
  const editReservationForm = document.getElementById('formEditReservation');
  if (editReservationForm) {
    
    // Validación del nombre del cliente (editar reservación)
    const nombreClienteEdit = document.getElementById('nombre_cliente');
    if (nombreClienteEdit) {
      nombreClienteEdit.addEventListener('focus', () => {
        if (!nombreClienteEdit.value.trim()) {
          showHelpMessage(nombreClienteEdit, 'Ingresa el nombre completo del cliente', 'info');
        }
      });

      nombreClienteEdit.addEventListener('input', () => {
        // Filtrar caracteres no válidos en tiempo real
        const originalValue = nombreClienteEdit.value;
        const filteredValue = originalValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        
        if (originalValue !== filteredValue) {
          nombreClienteEdit.value = filteredValue;
          showHelpMessage(nombreClienteEdit, 'Solo se permiten letras y espacios en el nombre', 'error');
          return;
        }
        
        const value = nombreClienteEdit.value.trim();
        
        // Regex para solo letras, espacios y acentos (nombres válidos)
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        
        if (!value) {
          showHelpMessage(nombreClienteEdit, 'El nombre del cliente es requerido', 'error');
        } else if (value.length < 3) {
          showHelpMessage(nombreClienteEdit, 'El nombre debe tener al menos 3 caracteres', 'error');
        } else if (!nameRegex.test(value)) {
          showHelpMessage(nombreClienteEdit, 'El nombre solo puede contener letras y espacios', 'error');
        } else if (value.length > 50) {
          showHelpMessage(nombreClienteEdit, 'El nombre es demasiado largo (máximo 50 caracteres)', 'error');
        } else {
          showHelpMessage(nombreClienteEdit, '✓ Nombre válido', 'success');
        }
      });

      nombreClienteEdit.addEventListener('blur', () => {
        if (nombreClienteEdit.value.trim()) {
          clearHelpMessage(nombreClienteEdit);
        }
      });
    }

    // Validación de habitación (editar reservación)
    const habitacionId = document.getElementById('habitacion_id');
    if (habitacionId) {
      habitacionId.addEventListener('focus', () => {
        if (!habitacionId.value) {
          showHelpMessage(habitacionId, 'Selecciona una habitación', 'info');
        }
      });

      habitacionId.addEventListener('change', () => {
        if (!habitacionId.value) {
          showHelpMessage(habitacionId, 'La habitación es requerida', 'error');
        } else {
          const selectedOption = habitacionId.options[habitacionId.selectedIndex];
          showHelpMessage(habitacionId, `✓ Habitación seleccionada: ${selectedOption.text}`, 'success');
        }
      });

      habitacionId.addEventListener('blur', () => {
        if (habitacionId.value) {
          clearHelpMessage(habitacionId);
        }
      });
    }

    // Validación de fecha de ingreso (editar reservación)
    const fechaIngresoEdit = document.getElementById('fecha_ingreso');
    if (fechaIngresoEdit) {
      fechaIngresoEdit.addEventListener('focus', () => {
        if (!fechaIngresoEdit.value) {
          showHelpMessage(fechaIngresoEdit, 'Selecciona la fecha de ingreso', 'info');
        }
      });

      fechaIngresoEdit.addEventListener('change', () => {
        if (!fechaIngresoEdit.value) {
          showHelpMessage(fechaIngresoEdit, 'La fecha de ingreso es requerida', 'error');
        } else {
          showHelpMessage(fechaIngresoEdit, '✓ Fecha de ingreso seleccionada', 'success');
          
          // Validar con fecha de salida si existe
          const fechaSalidaEdit = document.getElementById('fecha_salida');
          if (fechaSalidaEdit && fechaSalidaEdit.value) {
            if (fechaSalidaEdit.value <= fechaIngresoEdit.value) {
              showHelpMessage(fechaSalidaEdit, 'La fecha de salida debe ser posterior al ingreso', 'error');
            }
          }
        }
      });

      fechaIngresoEdit.addEventListener('blur', () => {
        if (fechaIngresoEdit.value) {
          clearHelpMessage(fechaIngresoEdit);
        }
      });
    }

    // Validación de fecha de salida (editar reservación)
    const fechaSalidaEdit = document.getElementById('fecha_salida');
    if (fechaSalidaEdit) {
      fechaSalidaEdit.addEventListener('focus', () => {
        if (!fechaSalidaEdit.value) {
          showHelpMessage(fechaSalidaEdit, 'Selecciona la fecha de salida', 'info');
        }
      });

      fechaSalidaEdit.addEventListener('change', () => {
        const fechaIngresoValue = document.getElementById('fecha_ingreso')?.value;
        
        if (!fechaSalidaEdit.value) {
          showHelpMessage(fechaSalidaEdit, 'La fecha de salida es requerida', 'error');
        } else if (fechaIngresoValue && fechaSalidaEdit.value <= fechaIngresoValue) {
          showHelpMessage(fechaSalidaEdit, 'La fecha de salida debe ser posterior al ingreso', 'error');
        } else {
          showHelpMessage(fechaSalidaEdit, '✓ Fecha de salida válida', 'success');
        }
      });

      fechaSalidaEdit.addEventListener('blur', () => {
        const fechaIngresoValue = document.getElementById('fecha_ingreso')?.value;
        if (fechaSalidaEdit.value && fechaIngresoValue && fechaSalidaEdit.value > fechaIngresoValue) {
          clearHelpMessage(fechaSalidaEdit);
        }
      });
    }

    // Validación del monto (editar reservación)
    const monto = document.getElementById('monto');
    if (monto) {
      monto.addEventListener('focus', () => {
        if (!monto.value || monto.value === '0') {
          showHelpMessage(monto, 'Ingresa el monto de la reservación', 'info');
        }
      });

      monto.addEventListener('input', () => {
        const value = parseFloat(monto.value) || 0;
        
        if (!monto.value || value === 0) {
          showHelpMessage(monto, 'El monto es requerido', 'error');
        } else if (value < 0) {
          showHelpMessage(monto, 'El monto no puede ser negativo', 'error');
        } else if (value < 100) {
          showHelpMessage(monto, 'El monto parece muy bajo, verifica que sea correcto', 'error');
        } else {
          showHelpMessage(monto, `✓ Monto válido: $${value.toFixed(2)}`, 'success');
          
          // Actualizar monto en letras si existe la función
          const montoLetras = document.getElementById('monto_letras');
          if (montoLetras && window.numberToWords) {
            montoLetras.value = window.numberToWords(value);
          } else if (montoLetras && window.numberToWordsGlobal) {
            montoLetras.value = window.numberToWordsGlobal(value);
          }
        }
      });

      monto.addEventListener('blur', () => {
        const value = parseFloat(monto.value) || 0;
        if (value > 0) {
          clearHelpMessage(monto);
        }
      });
    }

    console.log('⚡ Validación en tiempo real aplicada al formulario de EDITAR reservación');
  }

  console.log("✅ Validación en tiempo real completamente configurada");
});
