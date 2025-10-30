/**
 * Módulo Validator que encapsula la lógica de validación de formularios.
 * Está diseñado para ser reutilizable en cualquier formulario de la aplicación.
 * Sigue un patrón de módulo simple.
 */
const Validator = {
    rules: {
        nombre_completo: {
            regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/,
            message: 'El nombre debe contener letras y espacios (Un mínimo de 3 caracteres).'
        },
        'integrantes[]': {
            regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/,
            message: 'El nombre del integrante es inválido.'
        },
        descuento: {
            validator: (value) => {
                if (value === '') return true; // El descuento es opcional
                const num = Number(value);
                return Number.isInteger(num) && num >= 0 && num <= 100;
            },
            message: 'El descuento debe ser un número entero entre 0 y 100.'
        },
        telefono: {
            regex: /^(\d{10})?$/, // Permite campo vacío o exactamente 10 dígitos
            message: 'El teléfono debe contener 10 dígitos o estar vacío.'
        },
        correo: {
            regex: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
            message: 'Por favor, introduce un correo electrónico válido.'
        },
        fecha_inicio: {
            validator: (value) => value !== '',
            message: 'La fecha de inicio es obligatoria.'
        },
        metodo_pago: {
            validator: (value) => value !== '',
            message: 'Debes seleccionar un método de pago.'
        },
        id_tipo_membresia: { // Actualizado para coincidir con el 'name' del select
            validator: (value) => value !== '',
            message: 'Debes seleccionar un tipo de membresía.'
        }
    },

    /**
     * Valida todos los campos de un formulario basándose en el objeto `rules`.
     * Muestra u oculta mensajes de error directamente en el DOM.
     * @param {HTMLFormElement} form - El formulario a validar.
     * @returns {boolean} - True si el formulario es válido, de lo contrario false.
     */
    validateForm: function (form) {
        let isFormValid = true;
        
        // 1. Limpieza: Antes de validar, oculta todos los mensajes de error existentes
        // y elimina los estilos de borde rojo para empezar desde un estado limpio.
        form.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
        form.querySelectorAll('input, select').forEach(el => el.classList.remove('border-red-500'));

        for (const fieldName in this.rules) {
            const inputs = form.querySelectorAll(`[name="${fieldName}"]`);
            if (inputs.length === 0) continue;

            inputs.forEach(input => {
                const rule = this.rules[fieldName];
                const value = input.value.trim();
                let isFieldValid = false;

                if (rule.regex) {
                    isFieldValid = rule.regex.test(value);
                } else if (rule.validator) {
                    isFieldValid = rule.validator(value);
                }

                if (!isFieldValid) {
                    // Los campos de integrantes no tienen un .nextElementSibling, el error se muestra en un contenedor general.
                    // Para otros campos, se puede mantener la lógica del nextElementSibling si existe.
                    let errorContainer = input.nextElementSibling;
                    if (!errorContainer || !errorContainer.classList.contains('error-message')) {
                        // Si no hay un contenedor de error específico, se puede buscar uno general o simplemente marcar el campo.
                        // Por ahora, solo marcamos el campo y el mensaje se podría mostrar en `membershipMessage`.
                         this.showFieldError(input, rule.message);
                    } else {
                         this.showFieldError(input, rule.message);
                    }
                    isFormValid = false;
                }
            });
        }
        // 5. Retorno: Devuelve el estado final de la validación del formulario.
        return isFormValid;
    },

    /**
     * Muestra un mensaje de error para un campo específico.
     * @param {HTMLElement} input - El campo que tiene el error.
     * @param {string} message - El mensaje de error a mostrar.
     */
    showFieldError: function(input, message) {
        input.classList.add('border-red-500');
        let errorContainer = input.nextElementSibling;

        // Si el contenedor de error no existe o no es el correcto, lo creamos.
        // Esto es especialmente útil para campos dinámicos como los de integrantes.
        if (!errorContainer || !errorContainer.classList.contains('error-message')) {
            errorContainer = document.createElement('div');
            errorContainer.classList.add('error-message', 'text-red-600', 'text-sm', 'mt-1');
            // insertAfter
            input.parentNode.insertBefore(errorContainer, input.nextSibling);
        }

        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
    }
};

export { Validator };