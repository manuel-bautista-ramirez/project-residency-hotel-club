// Modulo exportable para reutilización
const Validator = {
    rules: {
        nombre_completo: {
            regex: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/,
            message: 'El nombre debe contener letras y espacios (Un mínimo de 3 caracteres).'
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
     * Valida un formulario y devuelve true si es válido, false en caso contrario.
     * @param {HTMLFormElement} form - El formulario a validar.
     * @returns {boolean} - True si el formulario es válido, de lo contrario false.
     */
    validateForm: function (form) {
        let isFormValid = true;
        
        // Limpia errores anteriores
        form.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
        form.querySelectorAll('input, select').forEach(el => el.classList.remove('border-red-500'));

        for (const fieldName in this.rules) {
            // Buscamos por 'name' en lugar de id
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (!input) continue;

            const rule = this.rules[fieldName];
            const value = input.value.trim();
            let isFieldValid = false;

            if (rule.regex) {
                isFieldValid = rule.regex.test(value);
            } else if (rule.validator) {
                isFieldValid = rule.validator(value);
            }
            
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
        return isFormValid;
    }
};