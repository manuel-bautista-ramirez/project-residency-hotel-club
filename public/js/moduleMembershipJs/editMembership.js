// Funciones de utilidad
const MembershipUI = {
  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    const integrantesContainer = document.getElementById(
      "integrantesContainer"
    );
    const addIntegranteBtn = document.getElementById("addIntegrante");

    // Manejar agregar integrantes
    if (addIntegranteBtn && integrantesContainer) {
      addIntegranteBtn.addEventListener("click", () => {
        this.addIntegrante(integrantesContainer);
      });

      // Agregar manejador de eventos a los botones de eliminar existentes
      document.querySelectorAll(".remove-integrante").forEach((btn) => {
        btn.addEventListener("click", function () {
          this.closest(".integrante-item").remove();
          MembershipUI.updateIntegrantesIndexes();
        });
      });
    }
  },

  addIntegrante: function (container) {
    const index = document.querySelectorAll(".integrante-item").length;
    const newIntegrante = `
      <div class="integrante-item bg-gray-50 p-4 rounded-lg border border-gray-200">
        <input type="hidden" name="integrantes[${index}][id_integrante]" value="">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-1">Nombre Completo</label>
            <input type="text" name="integrantes[${index}][nombre_completo]" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                   required>
          </div>
          <div class="flex items-end">
            <button type="button" class="remove-integrante inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <i class="fas fa-trash mr-1"></i> Eliminar
            </button>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement("div");
    div.innerHTML = newIntegrante;
    container.appendChild(div.firstElementChild);

    // Agregar manejador de eventos al nuevo botón de eliminar
    const removeBtn = div.querySelector(".remove-integrante");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        this.closest(".integrante-item").remove();
        MembershipUI.updateIntegrantesIndexes();
      });
    }
  },

  updateIntegrantesIndexes: function () {
    document.querySelectorAll(".integrante-item").forEach((item, index) => {
      const inputs = item.querySelectorAll("input");
      inputs.forEach((input) => {
        const name = input.getAttribute("name");
        if (name) {
          input.setAttribute("name", name.replace(/\[\d+\]/, `[${index}]`));
        }
      });
    });
  },
};

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});
