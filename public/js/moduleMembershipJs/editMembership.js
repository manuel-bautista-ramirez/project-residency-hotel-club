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
    const template = document.getElementById('integrante-template');
    if (!template) {
        console.error('Template "integrante-template" no encontrado.');
        return;
    }

    const index = document.querySelectorAll(".integrante-item").length;
    const clone = template.content.cloneNode(true);

    // Actualizar los índices en los atributos 'name'
    const inputs = clone.querySelectorAll('[name*="__INDEX__"]');
    inputs.forEach(input => {
        input.name = input.name.replace('__INDEX__', index);
    });

    // Agregar manejador de eventos al nuevo botón de eliminar
    const removeBtn = clone.querySelector(".remove-integrante");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        this.closest(".integrante-item").remove();
        MembershipUI.updateIntegrantesIndexes();
      });
    }

    container.appendChild(clone);
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
