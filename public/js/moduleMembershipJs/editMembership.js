/**
 * Objeto MembershipUI que encapsula la lógica para la edición de membresías,
 * incluyendo la validación del formulario y la gestión de integrantes.
 */
const MembershipUI = {
  /**
   * Inicializa el módulo.
   */
  init: function () {
    this.cacheDOM();
    this.bindEvents();
    this.bindInputFiltering();
  },

  /**
   * Guarda referencias a los elementos del DOM para un acceso más rápido.
   */
  cacheDOM: function() {
    this.form = document.getElementById("editMembershipForm");
    this.integrantesContainer = document.getElementById("integrantesContainer");
    this.addIntegranteBtn = document.getElementById("addIntegrante");
  },

  /**
   * Asigna los manejadores de eventos a los botones de "Agregar" y "Eliminar" integrantes.
   */
  bindEvents: function () {
    // Manejar envío del formulario
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        // Prevenir el envío si la validación del formulario falla.
        if (!Validator.validateForm(this.form)) {
          e.preventDefault();
          console.log("Validación del formulario de edición fallida.");
        }
      });
    }

    // Manejar agregar integrantes
    if (this.addIntegranteBtn && this.integrantesContainer) {
      this.addIntegranteBtn.addEventListener("click", () => {
        this.addIntegrante(this.integrantesContainer);
      });

      // Delegación de eventos para eliminar integrantes (existentes y nuevos)
      this.integrantesContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-integrante')) {
          e.target.closest(".integrante-item").remove();
          this.updateIntegrantesIndexes();
        }
      });
    }
  },

  /**
   * Vincula los eventos de filtrado de entrada en tiempo real a los campos del formulario.
   * Esto previene que el usuario ingrese caracteres no válidos.
   */
  bindInputFiltering: function() {
    const filterInput = (inputElement, regex) => {
        if (!inputElement) return;
        inputElement.addEventListener('input', (e) => {
            const originalValue = e.target.value;
            const sanitizedValue = originalValue.replace(regex, '');
            if (originalValue !== sanitizedValue) {
                e.target.value = sanitizedValue;
            }
        });
    };

    const nombreCompletoInput = document.getElementById('nombre_completo');
    const telefonoInput = document.getElementById('telefono');

    // Filtrar nombre completo (solo letras, espacios y caracteres españoles)
    filterInput(nombreCompletoInput, /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g);

    // Filtrar teléfono (solo números, máximo 10)
    if (telefonoInput) {
        telefonoInput.addEventListener('input', (e) => {
            const originalValue = e.target.value;
            let sanitizedValue = originalValue.replace(/[^0-9]/g, '');
            if (sanitizedValue.length > 10) {
                sanitizedValue = sanitizedValue.slice(0, 10);
            }
            if (originalValue !== sanitizedValue) {
                e.target.value = sanitizedValue;
            }
        });
    }

    // Delegación de eventos para los campos de integrantes creados dinámicamente
    if (this.integrantesContainer) {
        this.integrantesContainer.addEventListener('input', (e) => {
            if (e.target && e.target.name && e.target.name.includes('[nombre_completo]')) {
                const originalValue = e.target.value;
                const sanitizedValue = originalValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                if (originalValue !== sanitizedValue) {
                    e.target.value = sanitizedValue;
                }
            }
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

    const clone = template.content.cloneNode(true);
    container.appendChild(clone);
    this.updateIntegrantesIndexes();
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
      const inputs = item.querySelectorAll("input, select");
      inputs.forEach((input) => {
        const name = input.getAttribute("name");
        if (name) {
          // Reemplaza el número entre corchetes (o __INDEX__) por el nuevo índice.
          input.setAttribute("name", name.replace(/\[.*?\]/, `[${index}]`));
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
