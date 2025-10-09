/**
 * Se ejecuta cuando el contenido del DOM ha sido completamente cargado y parseado.
 * Es el punto de entrada para toda la lógica del script.
 */
document.addEventListener('DOMContentLoaded', function() {
    const tipoMembresiaSelect = document.getElementById('id_tipo_membresia');
    const fechaInicioInput = document.getElementById('fecha_inicio');
    const fechaFinInput = document.getElementById('fecha_fin');

    /**
     * Función asíncrona que se comunica con una API del backend para calcular
     * dinámicamente la fecha de fin de la membresía.
     * Se basa en el tipo de membresía y la fecha de inicio seleccionadas.
     */
    async function updateCalculatedDetails() {
        const id_tipo_membresia = tipoMembresiaSelect.value;
        const fecha_inicio = fechaInicioInput.value;

        // Solo proceder si tenemos los datos necesarios
        if (!id_tipo_membresia || !fecha_inicio) {
            return;
        }

        try {
            // Realiza una petición POST a la API. Se envía un objeto JSON con los datos necesarios.
            // El descuento se envía como 0 porque no es relevante para el cálculo de la fecha,
            // pero la API probablemente espera recibir ese campo.
            const resp = await fetch('/memberships/api/calculate-details', {
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
            fechaFinInput.value = data.fecha_fin;

        } catch (err) {
            console.error('Error al calcular detalles de la membresía:', err);
            // Aquí se podría añadir lógica para mostrar un mensaje de error al usuario en la UI.
        }
    }

    /**
     * Asigna la función `updateCalculatedDetails` como manejador del evento 'change'
     * para los campos de selección de membresía y fecha de inicio.
     * Esto hace que la fecha de fin se recalcule cada vez que el usuario modifica uno de estos campos.
     */
    if (tipoMembresiaSelect) {
        tipoMembresiaSelect.addEventListener('change', updateCalculatedDetails);
    }
    if (fechaInicioInput) {
        fechaInicioInput.addEventListener('change', updateCalculatedDetails);
    }

    /**
     * Llama a la función una vez al cargar la página para establecer el valor inicial
     * de la fecha de fin, basado en los valores por defecto del formulario.
     */
    updateCalculatedDetails();
});