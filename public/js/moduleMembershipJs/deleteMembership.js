/**
 * Clase DeleteModal que encapsula la lógica para mostrar un modal de confirmación
 * y manejar la eliminación de una membresía.
 */
class DeleteModal {
  /**
   * El constructor se encarga de inicializar la clase.
   * 1. Busca y cachea los elementos del DOM que componen el modal.
   * 2. Muestra un error en consola si el modal principal no se encuentra.
   * 3. Llama al método init() para vincular los eventos.
   */
  constructor() {
    this.modal = document.getElementById("deleteModal");
    if (!this.modal) {
      console.error("Modal element #deleteModal not found.");
      return;
    }

    this.iconContainer = document.getElementById("deleteModalIconContainer");
    this.icon = document.getElementById("deleteModalIcon");
    this.title = document.getElementById("deleteModalTitle");
    this.message = document.getElementById("deleteModalMessage");
    this.buttons = document.getElementById("deleteModalButtons");

    this.membershipId = null;
    this.init();
  }

  /**
   * Busca todos los botones con la clase '.delete-btn' y les añade un
   * event listener. Al hacer clic, se previene la acción por defecto, se
   * extraen los datos de la membresía y se muestra el modal de confirmación.
   */
  init() {
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.membershipId = btn.getAttribute("data-id");
        const membershipName = btn.getAttribute("data-name");
        const membershipType = btn.getAttribute("data-type");
        this.showConfirmation(membershipName, membershipType);
      });
    });
  }

  /**
   * Método privado y genérico para configurar y mostrar el modal.
   * Recibe un objeto de configuración para definir el título, mensaje,
   * ícono y botones, haciendo el modal reutilizable para diferentes
   * estados (confirmación, proceso, éxito, error).
   */
  _showModal(config) {
    this.title.textContent = config.title;
    this.message.innerHTML = config.message;

    this.icon.className = `text-xl ${config.iconClass}`;
    this.iconContainer.className = `p-3 rounded-full mr-4 ${config.iconBgClass}`;

    this.buttons.innerHTML = ''; // Clear previous buttons
    if (config.buttons) {
      config.buttons.forEach(btnConfig => {
        const button = document.createElement('button');
        button.innerHTML = btnConfig.html;
        button.className = btnConfig.class;
        button.addEventListener('click', btnConfig.onClick);
        this.buttons.appendChild(button);
      });
    }

    this.modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  /**
   * Oculta el modal y restaura el scroll del cuerpo de la página.
   */
  hideModal() {
    this.modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  /**
   * Muestra el estado inicial del modal: la confirmación de eliminación.
   * Construye un mensaje personalizado, incluyendo una advertencia adicional
   * si la membresía es de tipo "Familiar".
   */
  showConfirmation(name, type) {
    let warningText = type === "Familiar" ? " Esta acción también eliminará todos los integrantes asociados." : "";

    this._showModal({
      title: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas eliminar la membresía de <strong>"${name}"</strong>?${warningText}<br><br><span class="text-red-600 font-semibold">Esta acción no se puede deshacer.</span>`,
      iconClass: "fas fa-exclamation-triangle text-red-600",
      iconBgClass: "bg-red-100",
      buttons: [
        {
          html: 'Cancelar',
          class: 'px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors',
          onClick: () => this.hideModal()
        },
        {
          html: '<i class="fas fa-trash-alt mr-2"></i> Eliminar',
          class: 'px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors',
          onClick: () => this.confirmDelete()
        }
      ]
    });
  }

  /**
   * Función asíncrona que se ejecuta cuando el usuario confirma la eliminación.
   * 1. Muestra un estado de "Procesando" en el modal.
   * 2. Envía una petición DELETE al servidor con el ID de la membresía.
   * 3. Procesa la respuesta: si es exitosa, muestra un mensaje de éxito y
   *    recarga la página. Si falla, muestra un mensaje de error.
   */
  async confirmDelete() {
    if (!this.membershipId) return;

    this._showModal({
        title: "Procesando",
        message: "Eliminando la membresía, por favor espera...",
        iconClass: "fas fa-spinner fa-spin text-blue-600",
        iconBgClass: "bg-blue-100",
        buttons: []
    });

    try {
      const response = await fetch(`/memberships/delete/${this.membershipId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      this.showSuccessMessage();
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Muestra el modal en su estado de "Éxito" después de una eliminación correcta.
   */
  showSuccessMessage() {
    this._showModal({
      title: "¡Eliminado exitosamente!",
      message: "La membresía ha sido eliminada. La página se recargará en breve.",
      iconClass: "fas fa-check-circle text-green-600",
      iconBgClass: "bg-green-100",
      buttons: []
    });
  }

  /**
   * Muestra el modal en su estado de "Error" si la petición al servidor falla.
   * @param {string} errorMessage - El mensaje de error a mostrar.
   */
  showErrorMessage(errorMessage) {
    this._showModal({
      title: "Error",
      message: errorMessage,
      iconClass: "fas fa-exclamation-triangle text-red-600",
      iconBgClass: "bg-red-100",
      buttons: [
        {
          html: 'Cerrar',
          class: 'px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50',
          onClick: () => this.hideModal()
        }
      ]
    });
  }
}

/**
 * Punto de entrada del script.
 * Se asegura de que el DOM esté completamente cargado antes de instanciar
 * la clase DeleteModal para que comience a funcionar.
 */
document.addEventListener("DOMContentLoaded", () => {
  new DeleteModal();
});