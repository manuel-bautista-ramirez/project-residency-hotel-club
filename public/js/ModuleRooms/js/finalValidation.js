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

  // Función para inyectar el HTML del modal si no existe
  const injectModalHtml = () => {
    if (document.getElementById('custom-alert-modal')) return;

    const modalHtml = `
      <div id="custom-alert-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-[9999] transition-opacity duration-300">
        <div id="custom-alert-content" class="bg-white rounded-2xl shadow-2xl max-w-md w-11/12 mx-4 transform transition-all duration-300 scale-95 opacity-0">
          <div id="custom-alert-header" class="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <div id="custom-alert-icon" class="flex-shrink-0"></div>
            <h3 id="custom-alert-title" class="text-lg font-semibold text-gray-900 flex-1">Atención</h3>
            <button id="custom-alert-close" class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="px-6 py-5">
            <p id="custom-alert-message" class="text-gray-700 text-base leading-relaxed"></p>
          </div>
          <div class="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button id="custom-alert-confirm" class="px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2">
              Aceptar
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  };

  // Función para mostrar el modal profesional
  const showCustomAlert = (message, type = 'warning', title = null, onClose = null) => {
    injectModalHtml();

    const modal = document.getElementById('custom-alert-modal');
    const content = document.getElementById('custom-alert-content');
    const iconContainer = document.getElementById('custom-alert-icon');
    const titleElement = document.getElementById('custom-alert-title');
    const messageElement = document.getElementById('custom-alert-message');
    const confirmBtn = document.getElementById('custom-alert-confirm');
    const closeBtn = document.getElementById('custom-alert-close');

    const config = {
      warning: {
        title: title || 'Atención',
        icon: `<svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>`,
        btnColor: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'
      },
      error: {
        title: title || 'Error',
        icon: `<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        btnColor: 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
      },
      success: {
        title: title || 'Éxito',
        icon: `<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        btnColor: 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
      }
    };

    const settings = config[type] || config.warning;

    iconContainer.innerHTML = settings.icon;
    titleElement.textContent = settings.title;
    // Permitir HTML en el mensaje para las listas
    messageElement.innerHTML = message.replace(/\n/g, '<br>');

    confirmBtn.className = `px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${settings.btnColor}`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    setTimeout(() => {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);

    const closeModal = () => {
      content.classList.remove('scale-100', 'opacity-100');
      content.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (typeof onClose === 'function') onClose();
      }, 300);
    };

    confirmBtn.onclick = closeModal;
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
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

        // Mostrar alerta personalizada
        showCustomAlert(
          `Por favor completa los siguientes campos:\n• ${errorMessages.join('\n• ')}`,
          'warning'
        );

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

        // Mostrar alerta personalizada
        showCustomAlert(
          `Por favor completa los siguientes campos:\n• ${errorMessages.join('\n• ')}`,
          'warning'
        );

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

        // Mostrar alerta personalizada
        showCustomAlert(
          `Por favor completa los siguientes campos:\n• ${errorMessages.join('\n• ')}`,
          'warning'
        );

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
