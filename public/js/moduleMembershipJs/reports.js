/**
 * @file Script para gestionar la interfaz de usuario de la página de generación de reportes.
 * @summary Este script maneja la selección del período del reporte, la captura de fechas,
 * la comunicación con la API para obtener vistas previas y la visualización de los resultados o mensajes de error.
 */

/**
 * Se ejecuta cuando el contenido del DOM ha sido completamente cargado.
 * Es el punto de entrada para la lógica de la página de reportes.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    // Se cachean las referencias a los elementos para un acceso más rápido y eficiente.
    const periodOptions = document.querySelectorAll('.period-option');
    const generateBtn = document.getElementById('generate-report-btn');
    const messageArea = document.getElementById('message-area');
    const messageText = document.getElementById('message-text');
    const resultsTable = document.getElementById('results-table');
    const clearPreviewBtn = document.getElementById('clear-preview-btn');
    const notificationArea = document.getElementById('notification-area');
 
    // --- Estado de la UI ---
    // Almacena el período de reporte actualmente seleccionado ('monthly', 'biweekly', 'weekly').
    let currentPeriod = 'monthly';
 
    // --- Funciones ---
 
    /**
     * Muestra un mensaje en el área designada, ocultando la tabla de resultados.
     * @param {string} text - El texto del mensaje a mostrar.
     * @param {('info'|'error'|'warning')} [type='info'] - El tipo de mensaje, para aplicar el estilo visual correcto.
     */
    function showMessage(text, type = 'info') {
        messageText.textContent = text;
        messageText.className = type === 'error' ? 'text-red-500' : (type === 'warning' ? 'text-yellow-600' : 'text-gray-500');
        messageArea.classList.remove('hidden');
        resultsTable.classList.add('hidden');
    }
 
    /**
     * Rellena la tabla de resultados con los datos obtenidos de la API y muestra la tabla.
     * @param {object} data - Los datos del reporte que vienen de la API.
     * @param {object} data.ingresos - Objeto con los montos por método de pago.
     * @param {number} data.total - El monto total de ingresos.
     */
    function showResults(data) {
        const formatCurrency = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
        document.getElementById('monto-efectivo').textContent = formatCurrency(data.ingresos.efectivo);
        document.getElementById('monto-debito').textContent = formatCurrency(data.ingresos.debito);
        document.getElementById('monto-credito').textContent = formatCurrency(data.ingresos.credito);
        document.getElementById('monto-transferencia').textContent = formatCurrency(data.ingresos.transferencia);
        document.getElementById('monto-total').textContent = formatCurrency(data.total);

        const { period, date } = getReportParams();
        const downloadBtn = document.getElementById('download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.href = `/api/memberships/reports/download?period=${period}&date=${date}`;
            downloadBtn.closest('div').classList.remove('hidden'); // Asegurarse de que el contenedor del botón sea visible
        }

        messageArea.classList.add('hidden');
        resultsTable.classList.remove('hidden');
    }
 
    /**
     * Obtiene los parámetros de período y fecha seleccionados actualmente en la UI.
     * @returns {{period: string, date: string}} Un objeto con el período y la fecha formateada para la API.
     */
    function getReportParams() {
        let date;
        switch (currentPeriod) {
            case 'monthly':
                date = document.getElementById('month-input').value;
                break;
            case 'biweekly':
                const month = document.getElementById('biweekly-month-input').value;
                const fortnight = document.getElementById('fortnight-select').value;
                date = `${month}-${fortnight}`;
                break;
            case 'weekly':
                const rawDate = document.getElementById('week-input').value;
                date = rawDate.replace('-W', 'W');
                break;
        }
        return { period: currentPeriod, date };
    }
 
    /**
     * Función asíncrona que se comunica con la API para generar la vista previa del reporte.
     * Muestra un mensaje de carga, realiza la petición fetch y luego muestra los resultados o un error.
     */
    async function generateReportPreview() {
        const { period, date } = getReportParams();
        if (!date) {
            showMessage('Por favor, selecciona una fecha válida.', 'error');
            return;
        }

        showMessage('Generando vista previa...', 'info');

        try {
            const url = `/api/memberships/reports/preview?period=${period}&date=${date}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'No se pudo obtener la vista previa.');
            if (data.noData) {
                showMessage(data.message, 'warning');
                return;
            }
            showResults(data);
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    }
 
    // --- Asignación de Eventos (Event Listeners) ---
 
    // Añade un listener a cada opción de período (mensual, quincenal, semanal).
    // Al hacer clic, actualiza el estado `currentPeriod` y ajusta la UI para mostrar el selector de fecha correspondiente.
    periodOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Eliminar clases activas de todas las opciones
            periodOptions.forEach(opt => opt.classList.remove('bg-blue-500', 'text-white'));
            // Añadir clases activas a la opción seleccionada
            this.classList.add('bg-blue-500', 'text-white');

            currentPeriod = this.getAttribute('data-period');

            document.querySelectorAll('.date-selector').forEach(s => s.classList.add('hidden'));
            document.getElementById(`${currentPeriod}-selector`).classList.remove('hidden');
        });
    });
 
    // Asigna la función de generar vista previa al botón principal.
    generateBtn.addEventListener('click', generateReportPreview);
 
    // Asigna la función para limpiar la vista previa al nuevo botón.
    if (clearPreviewBtn) {
        clearPreviewBtn.addEventListener('click', () => {
            // Muestra el mensaje inicial y oculta la tabla de resultados.
            showMessage('Selecciona un tipo de reporte y una fecha para generar la vista previa', 'info');
            // Ocultar el botón de descarga si está visible
            document.getElementById('download-pdf-btn').closest('div').classList.add('hidden');
        });
    }
    // --- Inicialización ---
    // Esta sección se ejecuta una sola vez al cargar la página.
 
    // Establece los valores por defecto de los inputs de fecha al día/mes/semana actual.
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    document.getElementById('month-input').value = `${year}-${month}`;
    document.getElementById('biweekly-month-input').value = `${year}-${month}`;
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    document.getElementById('week-input').value = `${year}-W${week.toString().padStart(2, '0')}`;
 
    // Revisa si la URL contiene un parámetro 'error' (ej. por un fallo en la descarga del PDF).
    // Si existe, muestra una notificación de error al usuario y limpia la URL.
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        notificationArea.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Error: </strong>
                    <span class="block sm:inline">${decodeURIComponent(error)}</span>
                </div>`;
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});