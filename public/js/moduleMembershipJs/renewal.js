/**
 * Se ejecuta cuando el contenido del DOM ha sido completamente cargado y parseado.
 * Es el punto de entrada para toda la lógica del script.
 */
document.addEventListener('DOMContentLoaded', function() {
    const tipoMembresiaSelect = document.getElementById('id_tipo_membresia');
    const fechaInicioInput = document.getElementById('fecha_inicio');
    const fechaFinInput = document.getElementById('fecha_fin');
    const precioFinalInput = document.getElementById('precio_final');
    const integrantesSection = document.getElementById('integrantesSection');
    const integrantesContainer = document.getElementById('integrantesContainer');
    const addIntegranteBtn = document.getElementById('addIntegranteBtn');
    let maxIntegrantes = 1;

    /**
     * Función asíncrona que se comunica con una API del backend para calcular
     * dinámicamente la fecha de fin de la membresía.
     * Se basa en el tipo de membresía y la fecha de inicio seleccionadas.
     */
    async function updateCalculatedDetails() {
        const id_tipo_membresia = tipoMembresiaSelect.value;
        const fecha_inicio = fechaInicioInput.value;
        const descuento = 0; // El descuento no aplica en renovación según el flujo actual

        // Solo proceder si tenemos los datos necesarios
        if (!id_tipo_membresia || !fecha_inicio) {
            return;
        }

        try {
            // Realiza una petición POST a la API. Se envía un objeto JSON con los datos necesarios.
            // El descuento se envía como 0 porque no es relevante para el cálculo de la fecha,
            // pero la API probablemente espera recibir ese campo.
            const resp = await fetch('/memberships/api/calculate-details', { // Reutilizamos la API existente
                method: 'POST',
                body: JSON.stringify({ id_tipo_membresia, fecha_inicio, descuento: 0 }), // El descuento no es relevante para la fecha
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            const data = await resp.json();

            // Si la respuesta del servidor no es exitosa (ej. status 400 o 500), lanza un error.
            if (!resp.ok) {
                throw new Error(data.error || 'Error del servidor al calcular la fecha de fin.');
            }

            // Si la petición fue exitosa, actualiza el valor del campo de fecha de fin en el formulario.
            if (fechaFinInput) fechaFinInput.value = data.fecha_fin;
            if (precioFinalInput) precioFinalInput.value = data.precio_final;

        } catch (err) {
            console.error('Error al calcular detalles de la membresía:', err);
            // Aquí se podría añadir lógica para mostrar un mensaje de error al usuario en la UI.
        }
    }

    /**
     * Maneja el cambio en el tipo de membresía para mostrar u ocultar la sección de integrantes.
     */
    function handleTipoMembresiaChange() {
        const selectedOption = tipoMembresiaSelect.options[tipoMembresiaSelect.selectedIndex];
        const tipoNombre = selectedOption.text.toLowerCase();
        maxIntegrantes = parseInt(selectedOption.dataset.maxIntegrantes, 10) || 1;

        updateCalculatedDetails(); // Recalcular precio y fecha al cambiar tipo

        integrantesContainer.innerHTML = ""; // Limpiar integrantes al cambiar

        if (tipoNombre.includes('familiar') && integrantesSection) {
            integrantesSection.classList.remove('hidden');
            
            // Siempre añadir un mínimo de 3 campos de integrante no eliminables para membresías familiares
            const minFixedIntegrantes = 3; 
            for (let i = 0; i < minFixedIntegrantes; i++) {
                addIntegrante(false); // Añadir campos no eliminables
            }

            // Si el tipo de membresía permite más de 3 integrantes adicionales, mostrar el botón "Agregar Integrante"
            if (maxIntegrantes - 1 > minFixedIntegrantes) {
                addIntegranteBtn.classList.remove('hidden');
            } else {
                addIntegranteBtn.classList.add('hidden');
            }
        } else {
            integrantesSection.classList.add('hidden');
            addIntegranteBtn.classList.add('hidden'); // Ocultar el botón si no es membresía familiar
        }
    }

    /**
     * Añade un nuevo campo de integrante al formulario.
     */
    function addIntegrante(isRemovable = true) { // Por defecto, los nuevos integrantes son eliminables
        const template = document.getElementById('integrante-template');
        if (!template) return;

        // Si se está añadiendo un integrante eliminable, verificar el límite de integrantes adicionales
        if (isRemovable && maxIntegrantes > 1 && currentCount >= (maxIntegrantes - 1)) {
            alert(`Se permite un máximo de ${maxIntegrantes - 1} integrantes adicionales para este tipo de membresía.`);
            return;
        }

        const clone = template.content.cloneNode(true);
        const index = Date.now(); // Usar timestamp para un índice único y evitar colisiones

        clone.querySelectorAll('[name*="__INDEX__"]').forEach(input => {
            input.name = input.name.replace('__INDEX__', index);
        });

        const removeBtn = clone.querySelector('.remove-integrante');
        if (removeBtn) { // Asegurarse de que el botón existe en la plantilla
            if (isRemovable) {
                removeBtn.addEventListener('click', function() {
                    this.closest('.integrante-item').remove();
                    updateIntegrantesIndexes();
                    // Re-evaluar la visibilidad del botón "Agregar Integrante" después de eliminar
                    if (maxIntegrantes - 1 > integrantesContainer.querySelectorAll('.integrante-item').length) {
                        addIntegranteBtn.classList.remove('hidden');
                    }
                });
            } else {
                removeBtn.remove(); // Eliminar el botón si el campo no es eliminable
            }
        }



        integrantesContainer.appendChild(clone);
        updateIntegrantesIndexes();
    }

    /**
     * Re-indexa los campos de integrantes para que el backend los reciba correctamente.
     */
    function updateIntegrantesIndexes() {
        integrantesContainer.querySelectorAll('.integrante-item').forEach((item, index) => {
            item.querySelectorAll('input, select').forEach(input => {
                if (input.name) {
                    input.name = input.name.replace(/\[.*?\]/, `[${index}]`);
                }
            });
        });
    }

    // --- VINCULACIÓN DE EVENTOS ---

    // Delegación de eventos para botones de eliminar
    if (integrantesContainer) {
        integrantesContainer.addEventListener('click', function(e) {
            if (e.target.closest('.remove-integrante')) {
                // Solo eliminar si el botón de eliminar está presente en el elemento clicado
                const removeBtnClicked = e.target.closest('.remove-integrante');
                if (!removeBtnClicked) return; 

                removeBtnClicked.closest('.integrante-item').remove();
                updateIntegrantesIndexes();
                // Re-evaluar la visibilidad del botón "Agregar Integrante" después de eliminar
                if (maxIntegrantes - 1 > integrantesContainer.querySelectorAll('.integrante-item').length) {
                    addIntegranteBtn.classList.remove('hidden');
                }
            }
        });
    }

    /**
     * Asigna la función `updateCalculatedDetails` como manejador del evento 'change'
     * para los campos de selección de membresía y fecha de inicio.
     * Esto hace que la fecha de fin se recalcule cada vez que el usuario modifica uno de estos campos.
     */
    if (tipoMembresiaSelect) {
        tipoMembresiaSelect.addEventListener('change', handleTipoMembresiaChange);
    }
    if (fechaInicioInput) {
        fechaInicioInput.addEventListener('change', updateCalculatedDetails);
    }
    if (addIntegranteBtn) {
        addIntegranteBtn.addEventListener('click', () => addIntegrante(true)); // Los nuevos integrantes son eliminables
    }

    /**
     * Llama a la función una vez al cargar la página para establecer el valor inicial
     * de la fecha de fin, basado en los valores por defecto del formulario.
     */
    function initializeForm() {
        handleTipoMembresiaChange(); // Esto también llama a updateCalculatedDetails
    }

    initializeForm();
});