class DeleteModal {
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

  hideModal() {
    this.modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

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

  showSuccessMessage() {
    this._showModal({
      title: "¡Eliminado exitosamente!",
      message: "La membresía ha sido eliminada. La página se recargará en breve.",
      iconClass: "fas fa-check-circle text-green-600",
      iconBgClass: "bg-green-100",
      buttons: []
    });
  }

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

document.addEventListener("DOMContentLoaded", () => {
  new DeleteModal();
});