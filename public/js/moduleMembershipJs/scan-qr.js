/**
 * @file scan-qr.js
 * @description Lógica del lado del cliente para la página de escaneo de QR y visualización del historial de acceso.
 */

// --- UTILS ---
const $ = (selector) => document.querySelector(selector);
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
};

// --- DOM ELEMENTS ---
const qrForm = $('#qr-scan-form');
const qrInput = $('#qr-code-input');
const modal = $('#qr-result-modal');
const modalContent = $('#modal-content');
const datePicker = $('#history-date-picker');
const historyTableBody = $('#access-history-table-body');

/**
 * Muestra el modal de resultados con la información de la membresía.
 * @param {object} data - Los datos de la membresía obtenidos de la API.
 */
const showResultModal = (data) => {
    let modalHeaderClass = 'bg-gray-500';
    let icon = 'fa-solid fa-question-circle';

    if (data.status === 'active') {
        modalHeaderClass = 'bg-gradient-to-r from-green-500 to-green-600';
        icon = 'fa-solid fa-check-circle';
    } else if (data.status === 'expired') {
        modalHeaderClass = 'bg-gradient-to-r from-red-500 to-red-600';
        icon = 'fa-solid fa-times-circle';
    } else { // not_found
        modalHeaderClass = 'bg-gradient-to-r from-yellow-500 to-yellow-600';
        icon = 'fa-solid fa-exclamation-triangle';
    }

    const details = data.details || {};
    const integrantesList = details.integrantes && details.integrantes.length > 0
        ? `
            <div class="mt-4 pt-4 border-t border-gray-200">
                <h4 class="text-md font-semibold text-gray-700 mb-2">Integrantes:</h4>
                <ul class="space-y-1 text-sm text-gray-600">
                    ${details.integrantes.map(i => `<li>- ${i.nombre_completo}</li>`).join('')}
                </ul>
            </div>
        ` : '';

    modalContent.innerHTML = `
        <div class="p-6 text-white text-center rounded-t-2xl ${modalHeaderClass}">
            <i class="${icon} text-5xl mb-3"></i>
            <h2 class="text-2xl font-bold">${data.message || 'Resultado del Escaneo'}</h2>
        </div>
        <div class="p-6">
            ${details.titular ? `
                <div class="space-y-2 text-gray-700">
                    <p><strong class="font-semibold">Titular:</strong> ${details.titular}</p>
                    <p><strong class="font-semibold">Tipo:</strong> ${details.tipo_membresia}</p>
                    <p><strong class="font-semibold">Inicio:</strong> ${formatDate(details.fecha_inicio)}</p>
                    <p><strong class="font-semibold">Vencimiento:</strong> ${formatDate(details.fecha_fin)}</p>
                </div>
                ${integrantesList}
            ` : `
                <p class="text-center text-gray-600">${data.message || 'No se pudo obtener información detallada.'}</p>
            `}
            <button id="close-modal-btn" class="mt-6 w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cerrar</button>
        </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 50);

    $('#close-modal-btn').addEventListener('click', hideResultModal);
};

/**
 * Oculta el modal de resultados.
 */
const hideResultModal = () => {
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        qrInput.value = '';
        qrInput.focus();
    }, 300);
};

/**
 * Actualiza la tabla de historial de acceso con los datos de una fecha específica.
 * @param {string} date - La fecha en formato YYYY-MM-DD.
 */
const updateHistoryTable = async (date) => {
    try {
        const response = await fetch(`/api/memberships/access-history?date=${date}`);
        if (!response.ok) throw new Error('Error al cargar el historial.');

        const result = await response.json();
        const logs = result.data;

        if (logs.length > 0) {
            historyTableBody.innerHTML = logs.map(log => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${log.titular}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${log.area_acceso}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(log.fecha_hora_entrada)}</td>
                </tr>
            `).join('');
        } else {
            historyTableBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No hay registros para la fecha seleccionada.</td></tr>';
        }
    } catch (error) {
        console.error(error);
        historyTableBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-red-500">Error al cargar el historial.</td></tr>';
    }
};


// --- EVENT LISTENERS ---

/**
 * Maneja el envío del formulario de escaneo de QR.
 */
qrForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let rawInput = qrInput.value.trim();
    if (!rawInput) return;

    let membershipId;

    // Intenta parsear el input como JSON (del escáner QR).
    try {
        const qrData = JSON.parse(rawInput);
        if (qrData && qrData.id_activa) {
            membershipId = qrData.id_activa;
        } else {
            // Si el JSON no tiene el formato esperado, intenta usar el input como está.
            membershipId = rawInput;
        }
    } catch (error) {
        // Si no es un JSON válido, asume que es una entrada manual (solo números).
        membershipId = rawInput;
    }

    // Si después de todo el proceso no tenemos un ID válido, no hacemos nada.
    if (!membershipId) {
        showResultModal({ status: 'not_found', message: 'ID de membresía inválido.' });
        return;
    }

    try {
        const response = await fetch(`/api/memberships/qr-info/${membershipId}`);
        const result = await response.json();

        if (response.ok && result.success) {
            showResultModal(result.data);
            if (result.data.status === 'active') {
                // Si el acceso fue exitoso, recargar el historial del día actual
                updateHistoryTable(datePicker.value);
            }
        } else {
            // Maneja tanto los errores de la API como los 'not_found' del servicio.
            showResultModal({
                status: 'not_found',
                message: result.message || 'Datos no encontrados.'
            });
        }
    } catch (error) {
        console.error('Error al verificar QR:', error);
        showResultModal({
            status: 'not_found',
            message: 'Error de conexión. No se pudo verificar el QR.'
        });
    }
});

/**
 * Filtra la entrada en tiempo real para permitir solo números en el campo de texto.
 * Esto no previene que el escáner pegue el JSON completo.
 */
qrInput.addEventListener('input', () => {
    // Permite que el campo esté temporalmente vacío o contenga el JSON.
    // Esta validación se enfoca en la escritura manual.
    if (!qrInput.value.startsWith('{')) {
        qrInput.value = qrInput.value.replace(/[^0-9]/g, '');
    }
});


/**
 * Maneja el cambio de fecha en el selector de historial.
 */
datePicker.addEventListener('change', () => {
    const selectedDate = datePicker.value;
    if (selectedDate) {
        updateHistoryTable(selectedDate);
    }
});

/**
 * Cierra el modal si se hace clic fuera del contenido.
 */
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideResultModal();
    }
});

/**
 * Cierra el modal si se presiona la tecla 'Escape'.
 */
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        hideResultModal();
    }
});
