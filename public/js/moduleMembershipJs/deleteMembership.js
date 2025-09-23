class DeleteModal {
  constructor() {
    this.modal = null;
    this.cancelBtn = null;
    this.confirmBtn = null;
    this.membershipId = null;
    this.membershipName = null;
    this.membershipType = null;

    this.init();
  }

  init() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupModal());
    } else {
      this.setupModal();
    }
  }

  setupModal() {
    this.modal = document.getElementById("deleteModal");
    this.cancelBtn = document.getElementById("cancelDelete");
    this.confirmBtn = document.getElementById("confirmDelete");

    if (!this.modal || !this.cancelBtn || !this.confirmBtn) {
      console.error("Elementos del modal no encontrados");
      return;
    }

    // Event listeners para botones de eliminar
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.membershipId = btn.getAttribute("data-id");
        this.membershipName = btn.getAttribute("data-name");
        this.membershipType = btn.getAttribute("data-type");
        this.showModal();
      });
    });

    // Event listeners para el modal
    this.cancelBtn.addEventListener("click", () => this.hideModal());
    this.confirmBtn.addEventListener("click", () => this.confirmDelete());

    // Cerrar modal al hacer clic fuera
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });

    console.log("Modal de eliminación inicializado correctamente");
  }

  showModal() {
    if (!this.modal) return;

    const message = this.modal.querySelector("p");
    let warningText =
      this.membershipType === "Familiar"
        ? " Esta acción también eliminará todos los integrantes asociados."
        : "";

    message.innerHTML = `¿Estás seguro de que deseas eliminar la membresía de <strong>"${this.membershipName}"</strong>?${warningText}<br><br><span class="text-red-600 font-semibold">Esta acción no se puede deshacer.</span>`;

    this.modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  hideModal() {
    if (this.modal) {
      this.modal.classList.add("hidden");
    }
    document.body.style.overflow = "auto";
    this.resetButtons();
    this.membershipId = null;
    this.membershipName = null;
    this.membershipType = null;
  }

  resetButtons() {
    if (this.confirmBtn) {
      this.confirmBtn.disabled = false;
      this.confirmBtn.innerHTML =
        '<i class="fas fa-trash-alt mr-2"></i> Eliminar';
    }
  }

  async confirmDelete() {
    if (!this.membershipId || !this.confirmBtn) return;

    try {
      this.confirmBtn.disabled = true;
      this.confirmBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Eliminando...';

      const response = await fetch(`/memberships/delete/${this.membershipId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
      });

      // Verificar el tipo de contenido
      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Respuesta no JSON:", text.substring(0, 200));
        throw new Error("El servidor devolvió una respuesta inesperada");
      }

      const data = await response.json();

      if (response.ok && data.success) {
        this.showSuccessMessage();
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error(
          data.error || `Error ${response.status}: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error en confirmDelete:", error);
      this.showErrorMessage(error.message);
    }
  }

  showSuccessMessage() {
    if (!this.modal) return;

    const modalContent = this.modal.querySelector(".bg-white");
    modalContent.innerHTML = `
            <div class="text-center py-6">
                <div class="bg-green-100 p-4 rounded-full inline-block mb-4">
                    <i class="fas fa-check-circle text-green-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">¡Eliminado exitosamente!</h3>
                <p class="text-gray-600">La membresía ha sido eliminada correctamente.</p>
                <div class="mt-4">
                    <i class="fas fa-spinner fa-spin text-green-600"></i>
                    <span class="text-sm text-gray-500">Recargando página...</span>
                </div>
            </div>
        `;
  }

  showErrorMessage(errorMessage) {
    if (!this.modal) return;

    const modalContent = this.modal.querySelector(".bg-white");
    modalContent.innerHTML = `
            <div class="text-center py-6">
                <div class="bg-red-100 p-4 rounded-full inline-block mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Error</h3>
                <p class="text-gray-600 mb-4">${errorMessage}</p>
                <div class="flex justify-center space-x-3">
                    <button id="retryButton" 
                            class="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                        Reintentar
                    </button>
                    <button id="closeError" 
                            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

    // Agregar event listeners a los nuevos botones
    setTimeout(() => {
      const retryBtn = document.getElementById("retryButton");
      const closeBtn = document.getElementById("closeError");

      if (retryBtn) {
        retryBtn.addEventListener("click", () => this.confirmDelete());
      }
      if (closeBtn) {
        closeBtn.addEventListener("click", () => this.hideModal());
      }
    }, 100);
  }
}

// Exportar la clase para uso global
window.DeleteModal = DeleteModal;

// Inicialización automática
document.addEventListener("DOMContentLoaded", () => {
  new DeleteModal();
});
