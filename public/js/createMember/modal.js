// Función para mostrar el modal
  function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    
    // Configurar contenido
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Configurar eventos
    const cleanUpEvents = () => {
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };
    
    confirmBtn.onclick = () => {
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
      hideModal();
      cleanUpEvents();
    };
    
    cancelBtn.onclick = () => {
      hideModal();
      cleanUpEvents();
    };
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  
  // Función para ocultar el modal
  function hideModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
  
  // Cerrar modal al hacer clic fuera del contenido
  document.getElementById('confirmationModal').addEventListener('click', (e) => {
    if (e.target.id === 'confirmationModal') {
      hideModal();
    }
  });
  
  // Cerrar con ESC key
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('confirmationModal');
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      hideModal();
    }
  });
