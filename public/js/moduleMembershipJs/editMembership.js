// Funciones de utilidad
/**
 * Objeto MembershipUI que encapsula la lógica para la edición de membresías,
 * enfocándose específicamente en la gestión dinámica de los integrantes.
 */
const MembershipUI = {
  /**
   * Inicializa el módulo. Su única tarea es vincular los eventos a los elementos del DOM.
   */
  init: function () {
    this.bindEvents();
  },

  /**
   * Asigna los manejadores de eventos a los botones de "Agregar" y "Eliminar" integrantes.
   */
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

      // Asigna el evento de eliminación a los botones que ya existen en la página al cargar.
      // Esto es para los integrantes que ya estaban registrados.
      document.querySelectorAll(".remove-integrante").forEach((btn) => {
        btn.addEventListener("click", function () {
          this.closest(".integrante-item").remove();
          MembershipUI.updateIntegrantesIndexes();
        });
      });
    }
  },

  /**
   * Añade un nuevo campo de integrante al formulario.
   * Utiliza un <template> HTML para clonar la estructura del campo.
   * @param {HTMLElement} container - El elemento contenedor donde se añadirá el nuevo campo.
   */
  addIntegrante: function (container) {
    // Busca el template que contiene el HTML para un nuevo integrante.
    // Esta es una práctica moderna y limpia para no tener HTML mezclado en el JS.
    const template = document.getElementById('integrante-template');
    if (!template) {
        console.error('Template "integrante-template" no encontrado.');
        return;
    }

    const index = document.querySelectorAll(".integrante-item").length;
    const clone = template.content.cloneNode(true);

    // Actualiza los nombres de los inputs en el clon para que tengan el índice correcto.
    // Por ejemplo, cambia 'integrantes[__INDEX__][nombre]' a 'integrantes[2][nombre]'.
    // Esto es crucial para que el backend reciba los datos como un array.
    const inputs = clone.querySelectorAll('[name*="__INDEX__"]');
    inputs.forEach(input => {
        input.name = input.name.replace('__INDEX__', index);
    });

    // Asigna el evento de clic al botón de eliminar del *nuevo* elemento que acabamos de crear.
    const removeBtn = clone.querySelector(".remove-integrante");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        this.closest(".integrante-item").remove();
        MembershipUI.updateIntegrantesIndexes();
      });
    }

    container.appendChild(clone);
  },

  /**
   * Re-indexa los nombres de los campos de los integrantes restantes después de eliminar uno.
   * Si se elimina el integrante en la posición 1, los que estaban en las posiciones 2, 3, 4...
   * deben ser actualizados a 1, 2, 3... para evitar huecos en el array que se envía al servidor.
   * Por ejemplo, cambia 'integrantes[2][nombre]' a 'integrantes[1][nombre]'.
   */
  updateIntegrantesIndexes: function () {
    // Itera sobre todos los elementos de integrante que quedan en el DOM.
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

/**
 * Punto de entrada del script.
 * Se asegura de que el DOM esté completamente cargado antes de ejecutar la lógica de inicialización.
 */
document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});
