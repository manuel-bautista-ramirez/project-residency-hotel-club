/**
 * Sistema Global de Notificaciones Toast
 * Proporciona notificaciones elegantes y no intrusivas
 */

window.showNotification = function (message, type = 'info') {
  const existing = document.querySelectorAll('.professional-notification');
  existing.forEach(item => {
    item.classList.add('opacity-0', 'translate-y-[-100%]', 'sm:translate-x-full');
    setTimeout(() => item.remove(), 300);
  });

  const notification = document.createElement('div');
  const config = {
    success: {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-green-500',
      iconColor: 'text-green-500',
      icon: `
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `
    },
    error: {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-red-500',
      iconColor: 'text-red-500',
      icon: `
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      `
    },
    warning: {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-amber-500',
      iconColor: 'text-amber-500',
      icon: `
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      `
    },
    info: {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-l-blue-500',
      iconColor: 'text-blue-500',
      icon: `
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      `
    }
  };

  const { bgColor, borderColor, iconColor, icon } = config[type] || config.info;
  notification.className = `
    professional-notification
    fixed z-[9999]
    ${bgColor} ${borderColor}
    shadow-lg
    w-[95vw] max-w-sm
    mx-auto
    left-1/2 transform -translate-x-1/2
    sm:left-auto sm:right-4 sm:translate-x-0
    top-4 sm:top-4
    rounded-lg sm:rounded-r-lg
    px-3 py-3 sm:px-4 sm:py-3
    transition-all duration-300 ease-in-out
    border border-gray-200
    translate-y-[-100%] opacity-0
    sm:translate-x-full sm:opacity-0
  `.replace(/\s+/g, ' ').trim();

  notification.innerHTML = `
    <div class="flex items-start gap-2 sm:gap-3">
      <div class="flex-shrink-0 ${iconColor} mt-0.5">
        ${icon}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs sm:text-sm font-medium text-gray-900 leading-tight sm:leading-normal">${message}</p>
        <p class="text-[10px] sm:text-xs text-gray-500 mt-1">${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200 ml-1" aria-label="Cerrar notificación">
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.remove('translate-y-[-100%]', 'opacity-0', 'sm:translate-x-full', 'sm:opacity-0');
    notification.classList.add('translate-y-0', 'opacity-100', 'sm:translate-x-0', 'sm:opacity-100');
  }, 10);

  const removeNotification = () => {
    notification.classList.remove('translate-y-0', 'opacity-100', 'sm:translate-x-0', 'sm:opacity-100');
    notification.classList.add('translate-y-[-100%]', 'opacity-0', 'sm:translate-x-full', 'sm:opacity-0');
    setTimeout(() => {
      if (notification.parentElement) notification.remove();
    }, 300);
  };

  let autoRemove = setTimeout(removeNotification, 4000);

  const closeBtn = notification.querySelector('button');
  closeBtn.addEventListener('click', () => {
    clearTimeout(autoRemove);
    removeNotification();
  });

  notification.addEventListener('mouseenter', () => clearTimeout(autoRemove));
  notification.addEventListener('mouseleave', () => {
    autoRemove = setTimeout(removeNotification, 3000);
  });
};
