document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const scanForm = document.getElementById('scanForm');
    const qrInput = document.getElementById('qrInput');
    const modal = document.getElementById('scanResultModal');
    const modalContent = document.getElementById('modalContent');
    const modalHeader = document.getElementById('modalHeader');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitleText = document.getElementById('modalTitleText');
    const membershipDetails = document.getElementById('membershipDetails');
    const familyMembersSection = document.getElementById('familyMembersSection');
    const familyMembersList = document.getElementById('familyMembersList');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const historyDate = document.getElementById('historyDate');
    const historyTableBody = document.getElementById('historyTableBody');
    const noHistoryMessage = document.getElementById('no-history');

    /**
     * Muestra el modal de resultados con un efecto de animación.
     */
    function showModal() {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 50);
    }

    /**
     * Oculta el modal de resultados y resetea el campo de entrada.
     */
    function hideModal() {
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            qrInput.value = '';
            qrInput.focus();
        }, 300);
    }

    /**
     * Actualiza el contenido del modal basado en la respuesta de la API.
     * @param {object} data - El objeto con el estado y los detalles de la membresía.
     */
    function updateModalContent(data) {
        // Limpiar contenido previo
        membershipDetails.innerHTML = '';
        familyMembersList.innerHTML = '';
        familyMembersSection.classList.add('hidden');

        // Resetear clases de color
        modalHeader.className = 'p-5 border-b-2 transition-colors duration-300';

        switch (data.status) {
            case 'active':
                modalHeader.classList.add('bg-gradient-to-r', 'from-green-500', 'to-emerald-600', 'border-green-700');
                modalIcon.className = 'fas fa-check-circle mr-4';
                modalTitleText.textContent = 'Acceso Permitido';

                membershipDetails.innerHTML = `
                    <p><strong>Titular:</strong> ${data.details.nombre_completo}</p>
                    <p><strong>Tipo:</strong> ${data.details.tipo_membresia}</p>
                    <p><strong>Periodo:</strong> ${new Date(data.details.fecha_inicio).toLocaleDateString()} - ${new Date(data.details.fecha_fin).toLocaleDateString()}</p>
                `;

                if (data.details.integrantes && data.details.integrantes.length > 0) {
                    data.details.integrantes.forEach(integrante => {
                        const li = document.createElement('li');
                        li.textContent = integrante.nombre_completo;
                        familyMembersList.appendChild(li);
                    });
                    familyMembersSection.classList.remove('hidden');
                }
                break;

            case 'expired':
                modalHeader.classList.add('bg-gradient-to-r', 'from-red-500', 'to-red-700', 'border-red-800');
                modalIcon.className = 'fas fa-times-circle mr-4';
                modalTitleText.textContent = 'Acceso Denegado - Membresía Expirada';

                membershipDetails.innerHTML = `
                    <p><strong>Titular:</strong> ${data.details.nombre_completo}</p>
                    <p><strong>Tipo:</strong> ${data.details.tipo_membresia}</p>
                    <p class="font-bold text-red-600"><strong>Venció el:</strong> ${new Date(data.details.fecha_fin).toLocaleDateString()}</p>
                `;
                break;

            case 'not_found':
                modalHeader.classList.add('bg-gradient-to-r', 'from-yellow-500', 'to-amber-600', 'border-yellow-700');
                modalIcon.className = 'fas fa-question-circle mr-4';
                modalTitleText.textContent = 'Membresía no Encontrada';
                membershipDetails.innerHTML = `<p>${data.message}</p>`;
                break;
        }
    }

    /**
     * Maneja el envío del formulario de escaneo.
     * @param {Event} e - El evento de envío.
     */
    async function handleScan(e) {
        e.preventDefault();
        const rawValue = qrInput.value.trim();

        if (!rawValue) return;

        let id_activa;
        try {
            const qrData = JSON.parse(rawValue);
            id_activa = qrData.id_activa;
        } catch (error) {
            id_activa = rawValue;
        }

        if (!id_activa) {
            updateModalContent({ status: 'not_found', message: 'El código QR no contiene un ID de membresía válido.' });
            showModal();
            return;
        }

        try {
            const response = await fetch('/memberships/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_activa })
            });

            const result = await response.json();

            if (result.success) {
                updateModalContent(result);
                if (result.status === 'active') {
                    fetchHistory(historyDate.value); // Recargar historial si el acceso fue exitoso
                }
            } else {
                updateModalContent(result);
            }
        } catch (error) {
            console.error('Error en la petición de escaneo:', error);
            updateModalContent({ status: 'not_found', message: 'Error de conexión con el servidor.' });
        } finally {
            showModal();
        }
    }

    /**
     * Obtiene y muestra el historial de entradas para una fecha dada.
     * @param {string} date - La fecha en formato YYYY-MM-DD.
     */
    async function fetchHistory(date) {
        if (!date) return;

        try {
            const response = await fetch(`/memberships/api/history?date=${date}`);
            const result = await response.json();

            historyTableBody.innerHTML = ''; // Limpiar la tabla

            if (result.success && result.data.length > 0) {
                noHistoryMessage.style.display = 'none';
                result.data.forEach(entry => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50 transition-colors duration-200';
                    row.innerHTML = `
                        <td class="px-6 py-4 text-gray-800 font-semibold">${new Date(entry.fecha_hora_entrada).toLocaleTimeString()}</td>
                        <td class="px-6 py-4 text-gray-700">${entry.titular}</td>
                        <td class="px-6 py-4 text-gray-700">${entry.area_acceso}</td>
                    `;
                    historyTableBody.appendChild(row);
                });
            } else {
                noHistoryMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error al obtener el historial:', error);
            noHistoryMessage.textContent = 'Error al cargar el historial.';
            noHistoryMessage.style.display = 'block';
        }
    }

    // Event Listeners
    scanForm.addEventListener('submit', handleScan);
    closeModalBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Cargar el historial para la fecha actual al iniciar
    const today = new Date().toISOString().split('T')[0];
    historyDate.value = today;
    fetchHistory(today);

    historyDate.addEventListener('change', () => {
        fetchHistory(historyDate.value);
    });
});
