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
            regex: /^\d{10}$/,
            message: 'El teléfono debe contener 10 dígitos.'
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
            // Buscamos por 'name' en lugar de id
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (!input) continue;

            const rule = this.rules[fieldName];
            const value = input.value.trim();
            let isFieldValid = false;

            // 3. Aplicación de la regla: Determina si la regla es una expresión regular (regex)
            // o una función de validación personalizada y la ejecuta.
            if (rule.regex) {
                isFieldValid = rule.regex.test(value);
            } else if (rule.validator) {
                isFieldValid = rule.validator(value);
            }
            
            // 4. Manejo de errores: Si el campo no es válido, busca el elemento de error
            // asociado (que se asume es el siguiente hermano del input), le pone el mensaje
            // de la regla, lo hace visible y añade un borde rojo al input.
            // También marca el formulario como inválido.
            if (!isFieldValid) {
                const errorContainer = input.nextElementSibling;
                if (errorContainer && errorContainer.classList.contains('error-message')) {
                    errorContainer.textContent = rule.message;
                    errorContainer.classList.remove('hidden');
                    input.classList.add('border-red-500');
                }
                isFormValid = false;
            }
        }
        // 5. Retorno: Devuelve el estado final de la validación del formulario.
        return isFormValid;
    }
};