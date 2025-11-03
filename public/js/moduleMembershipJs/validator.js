/**
 * Módulo Validator que encapsula la lógica de validación de formularios.
 * Está diseñado para ser reutilizable en cualquier formulario de la aplicación.
 * Sigue un patrón de módulo simple.
 */
const Validator = {
    rules: {
        nombre: {
            regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/,
            message: 'El nombre debe contener entre 3 y 50 caracteres (solo letras y espacios).'
        },
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
        max_integrantes: {
            validator: (value) => {
                const num = Number(value);
                return Number.isInteger(num) && num >= 1;
            },
            message: 'Debe ser un número entero igual o mayor a 1.'
        },
        precio: {
            validator: (value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0,
            message: 'El precio debe ser un número mayor a 0.'
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

        // Limpieza: Oculta errores y quita bordes rojos antes de validar.
        form.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
        form.querySelectorAll('input, select').forEach(el => el.classList.remove('border-red-500'));

        // CORRECCIÓN: Iterar sobre los campos del formulario en lugar de todas las reglas.
        // Esto asegura que solo se validen los campos que realmente existen en el formulario actual.
        const fieldsToValidate = form.querySelectorAll('input[name], select[name], textarea[name]');

        fieldsToValidate.forEach(input => {
            const fieldName = input.name;
            const rule = this.rules[fieldName];

            // Si no hay una regla para este campo, o si es un campo oculto, lo ignoramos.
            if (!rule || input.type === 'hidden') {
                return;
            }

            const value = input.value.trim();
            let isFieldValid = false;

            if (rule.regex) {
                isFieldValid = rule.regex.test(value);
            } else if (rule.validator) {
                isFieldValid = rule.validator(value);
            }

            if (!isFieldValid) {
                this.showFieldError(input, rule.message);
                isFormValid = false;
            }
        });

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