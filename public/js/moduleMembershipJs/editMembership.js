import { Validator } from './validator.js';

/**
 * Objeto MembershipUI que encapsula la lógica para la edición de membresías,
 * incluyendo la validación del formulario y el filtrado de campos.
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
  },

  /**
   * Asigna los manejadores de eventos.
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

    // Delegación de eventos para los campos de nombre de los integrantes
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
};

/**
 * Punto de entrada del script.
 * Se asegura de que el DOM esté completamente cargado antes de ejecutar la lógica de inicialización.
 */
document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});
