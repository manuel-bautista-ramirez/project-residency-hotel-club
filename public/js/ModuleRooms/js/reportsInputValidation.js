// ============================================
// VALIDACIONES EN TIEMPO REAL PARA REPORTES
// Email y Teléfono
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  // ============================================
  // VALIDACIÓN DE EMAIL EN TIEMPO REAL
  // ============================================

  const emailInput = document.getElementById('email-destinatario');

  if (emailInput) {
    emailInput.addEventListener('input', function () {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = emailRegex.test(this.value.trim());

      // Remover mensaje de error previo
      const prevError = this.parentElement.querySelector('.email-error');
      if (prevError) prevError.remove();

      if (this.value.trim() && !isValid) {
        // Mostrar error
        this.classList.add('border-red-500', 'bg-red-50');
        this.classList.remove('border-gray-300');

        const errorMsg = document.createElement('p');
        errorMsg.className = 'email-error text-red-500 text-xs mt-1';
        errorMsg.textContent = '⚠️ Ingresa un correo electrónico válido (ejemplo@dominio.com)';
        this.parentElement.appendChild(errorMsg);
      } else if (this.value.trim()) {
        // Email válido
        this.classList.remove('border-red-500', 'bg-red-50');
        this.classList.add('border-green-500', 'bg-green-50');
      } else {
        // Campo vacío
        this.classList.remove('border-red-500', 'bg-red-50', 'border-green-500', 'bg-green-50');
        this.classList.add('border-gray-300');
      }
    });
  }

  // ============================================
  // VALIDACIÓN DE TELÉFONO EN TIEMPO REAL
  // ============================================

  const phoneInput = document.getElementById('whatsapp-telefono');

  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      // Solo permitir números
      this.value = this.value.replace(/\D/g, '');

      // Limitar a 10 dígitos
      if (this.value.length > 10) {
        this.value = this.value.slice(0, 10);
      }

      // Remover mensaje de error previo
      const prevError = this.parentElement.querySelector('.phone-error');
      if (prevError) prevError.remove();

      const isValid = /^\d{10}$/.test(this.value);

      if (this.value.length > 0 && !isValid) {
        // Mostrar error
        this.classList.add('border-red-500', 'bg-red-50');
        this.classList.remove('border-gray-300');

        const errorMsg = document.createElement('p');
        errorMsg.className = 'phone-error text-red-500 text-xs mt-1';
        errorMsg.textContent = `⚠️ Ingresa 10 dígitos (${this.value.length}/10)`;
        this.parentElement.appendChild(errorMsg);
      } else if (isValid) {
        // Teléfono válido
        this.classList.remove('border-red-500', 'bg-red-50');
        this.classList.add('border-green-500', 'bg-green-50');

        const prevError = this.parentElement.querySelector('.phone-error');
        if (prevError) prevError.remove();
      } else {
        // Campo vacío
        this.classList.remove('border-red-500', 'bg-red-50', 'border-green-500', 'bg-green-50');
        this.classList.add('border-gray-300');
      }
    });
  }

  // ============================================
  // VALIDACIÓN AL ENVIAR POR EMAIL
  // ============================================

  const emailButton = document.getElementById('enviar-email-btn');

  if (emailButton) {
    // Agregar validación antes del evento principal usando capture
    emailButton.addEventListener('click', function (e) {
      const email = document.getElementById('email-destinatario').value.trim();
      const asunto = document.getElementById('email-asunto').value.trim();
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!email) {
        e.stopImmediatePropagation(); // Detener otros listeners

        // Poner el input en rojo
        emailInput.classList.add('border-red-500', 'bg-red-50');
        emailInput.classList.remove('border-gray-300', 'border-green-500', 'bg-green-50');

        // Agregar mensaje de error si no existe
        const prevError = emailInput.parentElement.querySelector('.email-error');
        if (!prevError) {
          const errorMsg = document.createElement('p');
          errorMsg.className = 'email-error text-red-500 text-xs mt-1';
          errorMsg.textContent = '⚠️ Este campo es obligatorio';
          emailInput.parentElement.appendChild(errorMsg);
        }

        if (typeof window.showNotification === 'function') {
          window.showNotification('Por favor, ingresa un correo electrónico', 'warning');
        } else if (typeof showCustomAlert === 'function') {
          showCustomAlert('Por favor, ingresa un correo electrónico', 'warning', null, function () {
            // Limpiar campo al cerrar el modal
            emailInput.value = '';
            emailInput.classList.remove('border-red-500', 'bg-red-50');
            emailInput.classList.add('border-gray-300');
            const errorMsg = emailInput.parentElement.querySelector('.email-error');
            if (errorMsg) errorMsg.remove();
          });
        } else {
          alert('Por favor, ingresa un correo electrónico');
        }
        emailInput.focus();
        return;
      }

      if (!emailRegex.test(email)) {
        e.stopImmediatePropagation(); // Detener otros listeners

        // Poner el input en rojo
        emailInput.classList.add('border-red-500', 'bg-red-50');
        emailInput.classList.remove('border-gray-300', 'border-green-500', 'bg-green-50');

        if (typeof window.showNotification === 'function') {
          window.showNotification('Por favor, ingresa un correo electrónico válido', 'error');
        } else if (typeof showCustomAlert === 'function') {
          showCustomAlert('Por favor, ingresa un correo electrónico válido', 'error', null, function () {
            // Limpiar campo al cerrar el modal
            emailInput.value = '';
            emailInput.classList.remove('border-red-500', 'bg-red-50');
            emailInput.classList.add('border-gray-300');
            const errorMsg = emailInput.parentElement.querySelector('.email-error');
            if (errorMsg) errorMsg.remove();
          });
        } else {
          alert('Por favor, ingresa un correo electrónico válido');
        }
        emailInput.focus();
        return;
      }
    }, true); // true = usar capture phase
  }

  // ============================================
  // VALIDACIÓN AL ENVIAR POR WHATSAPP
  // ============================================

  const whatsappButton = document.getElementById('enviar-whatsapp-btn');

  if (whatsappButton) {
    // Agregar validación antes del evento principal usando capture
    whatsappButton.addEventListener('click', function (e) {
      const telefono = document.getElementById('whatsapp-telefono').value.trim();

      if (!telefono) {
        e.stopImmediatePropagation(); // Detener otros listeners

        // Poner el input en rojo
        phoneInput.classList.add('border-red-500', 'bg-red-50');
        phoneInput.classList.remove('border-gray-300', 'border-green-500', 'bg-green-50');

        // Agregar mensaje de error si no existe
        const prevError = phoneInput.parentElement.querySelector('.phone-error');
        if (!prevError) {
          const errorMsg = document.createElement('p');
          errorMsg.className = 'phone-error text-red-500 text-xs mt-1';
          errorMsg.textContent = '⚠️ Este campo es obligatorio';
          phoneInput.parentElement.appendChild(errorMsg);
        }

        if (typeof window.showNotification === 'function') {
          window.showNotification('Por favor, ingresa un número de teléfono', 'warning');
        } else if (typeof showCustomAlert === 'function') {
          showCustomAlert('Por favor, ingresa un número de teléfono', 'warning', null, function () {
            // Limpiar campo al cerrar el modal
            phoneInput.value = '';
            phoneInput.classList.remove('border-red-500', 'bg-red-50');
            phoneInput.classList.add('border-gray-300');
            const errorMsg = phoneInput.parentElement.querySelector('.phone-error');
            if (errorMsg) errorMsg.remove();
          });
        } else {
          alert('Por favor, ingresa un número de teléfono');
        }
        phoneInput.focus();
        return;
      }

      if (!/^\d{10}$/.test(telefono)) {
        e.stopImmediatePropagation(); // Detener otros listeners

        // Poner el input en rojo
        phoneInput.classList.add('border-red-500', 'bg-red-50');
        phoneInput.classList.remove('border-gray-300', 'border-green-500', 'bg-green-50');

        // Actualizar mensaje de error
        const prevError = phoneInput.parentElement.querySelector('.phone-error');
        if (prevError) {
          prevError.textContent = `⚠️ Ingresa 10 dígitos (${telefono.length}/10)`;
        } else {
          const errorMsg = document.createElement('p');
          errorMsg.className = 'phone-error text-red-500 text-xs mt-1';
          errorMsg.textContent = `⚠️ Ingresa 10 dígitos (${telefono.length}/10)`;
          phoneInput.parentElement.appendChild(errorMsg);
        }

        if (typeof window.showNotification === 'function') {
          window.showNotification('El número debe tener exactamente 10 dígitos', 'error');
        } else if (typeof showCustomAlert === 'function') {
          showCustomAlert('El número debe tener exactamente 10 dígitos', 'error', null, function () {
            // Limpiar campo al cerrar el modal
            phoneInput.value = '';
            phoneInput.classList.remove('border-red-500', 'bg-red-50');
            phoneInput.classList.add('border-gray-300');
            const errorMsg = phoneInput.parentElement.querySelector('.phone-error');
            if (errorMsg) errorMsg.remove();
          });
        } else {
          alert('El número debe tener exactamente 10 dígitos');
        }
        phoneInput.focus();
        return;
      }
    }, true); // true = usar capture phase
  }
});

// Exportar funciones para uso global si es necesario
window.ReportsInputValidation = {
  validateEmail: function (email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  },

  validatePhone: function (phone) {
    return /^\d{10}$/.test(phone.trim());
  },

  formatPhone: function (phone) {
    return phone.replace(/\D/g, '').slice(0, 10);
  }
};
