/**
 * Sistema Global de Notificaciones Toast
 * Proporciona notificaciones elegantes y no intrusivas
 */

window.showNotification = function (message, type = 'info') {
  // Remover notificaciones anteriores para evitar saturación
  const existingNotifications = document.querySelectorAll('.professional-notification');
  existingNotifications.forEach(notification => {
    notification.classList.add('opacity-0', 'translate-y-[-100%]', 'sm:translate-x-full');
    setTimeout(() => notification.remove(), 300);
  });

  const notification = document.createElement('div');

  // Configuración por tipo
  const config = {
    success: {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-green-500',
      iconColor: 'text-green-500',
      icon: `<i class="fas fa-check-circle"></i>`
    },
    error: {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-red-500',
      iconColor: 'text-red-500',
      icon: `<i class="fas fa-times-circle"></i>`
    },
    warning: {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-amber-500',
      iconColor: 'text-amber-500',
      icon: `<i class="fas fa-exclamation-triangle"></i>`
    },
    info: {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-blue-500',
      iconColor: 'text-blue-500',
      icon: `<i class="fas fa-info-circle"></i>`
    }
  };

  const { bgColor, borderColor, iconColor, icon } = config[type] || config.info;

  // Clases responsive
  notification.className = `
      professional-notification
      fixed z-[9999]
      ${bgColor} ${borderColor}
      shadow-lg
      w-[95vw] max-w-sm
      mx-auto
      left-1/2 transform -translate-x-1/2
      sm:left-auto sm:right-4 sm:translate-x-0
      top-4
      rounded-lg
      px-4 py-3
      transition-all duration-300 ease-in-out
      border border-gray-100
      translate-y-[-100%] opacity-0
      sm:translate-x-full
    `.replace(/\s+/g, ' ').trim();

  notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 ${iconColor} mt-0.5 text-lg">
          ${icon}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-800 leading-tight">${message}</p>
          <p class="text-[10px] text-gray-400 mt-1 font-medium">${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}</p>
        </div>
        <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200 ml-1">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

  document.body.appendChild(notification);

  // Animación de entrada
  setTimeout(() => {
    notification.classList.remove('translate-y-[-100%]', 'opacity-0', 'sm:translate-x-full');
    notification.classList.add('translate-y-0', 'opacity-100', 'sm:translate-x-0');
  }, 10);

  const removeNotif = () => {
    notification.classList.remove('translate-y-0', 'opacity-100', 'sm:translate-x-0');
    notification.classList.add('translate-y-[-100%]', 'opacity-0', 'sm:translate-x-full');
    setTimeout(() => { if (notification.parentElement) notification.remove(); }, 300);
  };

  // Auto-remove después de 4 segundos
  let autoRemove = setTimeout(removeNotif, 4000);

  // Permitir cerrar manualmente
  notification.querySelector('button').addEventListener('click', () => {
    clearTimeout(autoRemove);
    removeNotif();
  });

  // Pausar auto-remove al hacer hover
  notification.addEventListener('mouseenter', () => clearTimeout(autoRemove));
  notification.addEventListener('mouseleave', () => {
    autoRemove = setTimeout(removeNotif, 3000);
  });
};
