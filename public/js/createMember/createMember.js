
        // Script de depuración
        document.addEventListener('DOMContentLoaded', function () {
            // Establecer fechas por defecto
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(today.getDate() + 30);

            // Formatear fechas
            const formatDate = (date) => date.toISOString().split('T')[0];
            const todayStr = formatDate(today);
            const endDateStr = formatDate(endDate);

            // Establecer fechas en los campos
            const startInput = document.getElementById('startDate');
            const endInput = document.getElementById('endDate');
            const familyStartInput = document.getElementById('familyStartDate');
            const familyEndInput = document.getElementById('familyEndDate');

            if (startInput) startInput.value = todayStr;
            if (endInput) endInput.value = endDateStr;
            if (familyStartInput) familyStartInput.value = todayStr;
            if (familyEndInput) familyEndInput.value = endDateStr;

            // Evento para avanzar al formulario de membresía
            document.getElementById('nextToMembership').addEventListener('click', function () {
                // Validar formulario de cliente
                const clientName = document.getElementById('clientName').value;
                const clientPhone = document.getElementById('clientPhone').value;
                const clientEmail = document.getElementById('clientEmail').value;

                if (!clientName || !clientPhone || !clientEmail) {
                    alert('Por favor, complete todos los campos del cliente.');
                    return;
                }

                //  creación del cliente 
                const clientData = {
                    name: clientName,
                    phone: clientPhone,
                    email: clientEmail
                };
                fetch('memberships/createClient', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clientData)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Cliente creado:', data);
                    // Generar un ID de cliente simulado
                    const clientId = 'CLI-' + Math.floor(Math.random() * 10000);
                    document.getElementById('clientId').value = clientId;
                })
                .catch(error => {
                    console.error('Error al crear el cliente:', error);
                });
                // Generar un ID de cliente simulado
                const clientId = 'CLI-' + Math.floor(Math.random() * 10000);
                document.getElementById('clientId').value = clientId;

                // Mostrar información del cliente en el paso 2
                document.getElementById('displayClientName').textContent = clientName;
                document.getElementById('displayClientPhone').textContent = clientPhone;
                document.getElementById('displayClientEmail').textContent = clientEmail;

                // Cambiar al formulario de membresía
                document.getElementById('clientForm').classList.add('hidden');
                document.getElementById('membershipForm').classList.remove('hidden');
                document.getElementById('stepDescription').textContent = 'Complete la información de la membresía';
            });

            // Evento para volver al formulario de cliente
            document.getElementById('backToClient').addEventListener('click', function () {
                document.getElementById('membershipForm').classList.add('hidden');
                document.getElementById('clientForm').classList.remove('hidden');
                document.getElementById('stepDescription').textContent = 'Complete la información del cliente';
            });
        });

        // Selección de tipo de membresía
        function selectMembershipType(type) {
            document.querySelectorAll('.membership-type-card').forEach(card => {
                card.classList.remove('selected');
                card.querySelector('.bg-blue-600').classList.add('hidden');
            });

            // Actualizar la tarjeta seleccionada
            const selectedCard = event.currentTarget;
            selectedCard.classList.add('selected');
            selectedCard.querySelector('.bg-blue-600').classList.remove('hidden');

            // Actualizar el valor del input oculto
            document.getElementById('membershipType').value = type;

            // Mostrar el formulario correspondiente
            if (type === 'individual') {
                document.getElementById('individualForm').classList.remove('hidden');
                document.getElementById('familyForm').classList.add('hidden');
                // Ocultar la sección de precio para membresía individual
                document.getElementById('priceSection').classList.add('hidden');
                // Mostrar sección de pago
                document.getElementById('paymentSection').classList.remove('hidden');
            } else if (type === 'familiar') {
                document.getElementById('familyForm').classList.remove('hidden');
                document.getElementById('individualForm').classList.add('hidden');
                // Mostrar sección de pago
                document.getElementById('paymentSection').classList.remove('hidden');
                document.getElementById('priceSection').classList.remove('hidden');
            } else {
                // Ocultar todo si no hay selección
                document.getElementById('individualForm').classList.add('hidden');
                document.getElementById('familyForm').classList.add('hidden');
                document.getElementById('paymentSection').classList.add('hidden');
                document.getElementById('priceSection').classList.add('hidden');
            }
        }

        // Gestión de miembros familiares
        let memberCount = 0;
        document.getElementById('addFamilyMember').addEventListener('click', function () {
            if (memberCount >= 4) {
                alert('Solo se pueden agregar hasta 4 miembros adicionales.');
                return;
            }

            memberCount++;
            const memberHtml = `
                <div class="family-member-card bg-gray-50 p-4 rounded-lg mb-3">
                    <h4 class="font-medium text-gray-700 mb-2">Miembro #${memberCount}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Nombre completo</label>
                            <input type="text" name="familyMemberName${memberCount}" class="w-full px-3 py-1 border border-gray-300 rounded" required>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">Teléfono</label>
                            <input type="tel" name="familyMemberPhone${memberCount}" class="w-full px-3 py-1 border border-gray-300 rounded" required>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('familyMembersContainer').insertAdjacentHTML('beforeend', memberHtml);

            if (memberCount >= 4) {
                document.getElementById('addFamilyMember').classList.add('hidden');
            }
        });

        // Validación del formulario antes de enviar
        document.getElementById('membershipForm').addEventListener('submit', function (e) {
            const membershipType = document.getElementById('membershipType').value;
            if (!membershipType) {
                e.preventDefault();
                alert('Por favor, seleccione un tipo de membresía.');
                return;
            }

            // Aquí puedes agregar más validaciones según sea necesario
        });
  