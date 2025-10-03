// Funciones de utilidad
const MembershipUI = {
  init: function () {
    this.bindEvents();
    this.applyInitialFormatting();
  },

  bindEvents: function () {
    // Referencias a elementos del DOM
    this.reportButton = document.getElementById("reportButton");
    this.reportModal = document.getElementById("reportModal");
    this.closeReportModal = document.getElementById("closeReportModal");
    this.searchInput = document.getElementById("searchInput");
    this.statusFilter = document.getElementById("statusFilter");
    this.sortBy = document.getElementById("sortBy");
    this.membershipRows = document.querySelectorAll(".membership-row");

    // Modal de reportes para administradores
    if (this.reportButton && this.reportModal && this.closeReportModal) {
      this.reportButton.addEventListener("click", () => {
        this.reportModal.classList.remove("hidden");
      });

      this.closeReportModal.addEventListener("click", () => {
        this.reportModal.classList.add("hidden");
      });

      // Cerrar modal al hacer clic fuera del contenido
      this.reportModal.addEventListener("click", (e) => {
        if (e.target === this.reportModal) {
          this.reportModal.classList.add("hidden");
        }
      });
    }

    // Búsqueda y filtros
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => {
        this.filterMemberships();
      });
    }

    if (this.statusFilter) {
      this.statusFilter.addEventListener("change", () => {
        this.filterMemberships();
      });
    }

    if (this.sortBy) {
      this.sortBy.addEventListener("change", () => {
        this.filterMemberships();
      });
    }

    // Delegación de eventos para el botón de ver integrantes
    document.addEventListener('click', (e) => {
      const viewMembersBtn = e.target.closest('.view-members-btn');
      if (viewMembersBtn) {
        e.preventDefault();
        e.stopPropagation();
        // Pasar el botón como contexto
        this.handleViewMembersClick({ 
          currentTarget: viewMembersBtn,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation()
        });
      }

      const viewDetailsBtn = e.target.closest('.view-details-btn');
      if (viewDetailsBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.handleViewDetailsClick({
          currentTarget: viewDetailsBtn,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation()
        });
      }
    });
  },

  applyInitialFormatting: function () {
    // Iniciales de los nombres con avatar de gradiente
    const initialElements = document.querySelectorAll("[data-initial]");
    initialElements.forEach((element) => {
      const name = element.getAttribute("data-initial");
      element.textContent = this.getFirstLetter(name);
    });

    // Formatear todas las fechas en la tabla
    const dateFields = document.querySelectorAll(".date-field");
    dateFields.forEach((field) => {
      const dateText = field.textContent.trim();
      if (dateText && !isNaN(new Date(dateText).getTime())) {
        field.textContent = this.formatDate(dateText);
        field.setAttribute("data-original", dateText);
      }
    });
  },

  getFirstLetter: function (name) {
    return name ? name.charAt(0).toUpperCase() : "";
  },

  formatDate: function (dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  },

  
  showIntegrantesModal: function (integrantes) {
    if (!integrantes || integrantes.length === 0) {
      alert("Esta membresía no tiene integrantes registrados");
      return;
    }

    const template = document.getElementById('integrantes-modal-template');
    if (!template) {
        console.error('Template "integrantes-modal-template" no encontrado.');
        return;
    }
    const modalClone = template.content.cloneNode(true);
    const listContainer = modalClone.querySelector('[data-template-content="integrantes-list"]');

    integrantes.forEach(int => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-2">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span class="text-purple-600 font-bold">${this.getFirstLetter(int.nombre_completo)}</span>
                    </div>
                    <span class="text-sm text-gray-700">${int.nombre_completo || "Sin nombre"}</span>
                </div>
            </td>
        `;
        listContainer.appendChild(row);
    });

    const modalElement = modalClone.firstElementChild;
    document.body.appendChild(modalElement);

    const closeModal = () => modalElement.remove();
    modalElement.querySelector('.close-integrantes-modal').addEventListener('click', closeModal);
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) closeModal();
    });
  },

  showDetailsModal: function (details) {
    const template = document.getElementById('details-modal-template');
    if (!template) {
        console.error('Template "details-modal-template" no encontrado.');
        return;
    }
    const modalClone = template.content.cloneNode(true);

    const infoContainer = modalClone.querySelector('[data-template-content="details-info"]');
    const qrContainer = modalClone.querySelector('[data-template-content="details-qr"]');

    // Populate Info
    let infoHtml = `
        <div><p class="text-sm font-semibold text-gray-500">Titular</p><p class="text-lg font-medium text-gray-900">${details.nombre_completo}</p></div>
        <div><p class="text-sm font-semibold text-gray-500">Tipo de Membresía</p><p class="text-lg font-medium text-gray-900">${details.tipo_membresia}</p></div>
        <div><p class="text-sm font-semibold text-gray-500">Periodo</p><p class="text-lg font-medium text-gray-900">${this.formatDate(details.fecha_inicio)} - ${this.formatDate(details.fecha_fin)}</p></div>`;

    if (details.integrantes && details.integrantes.length > 0) {
        infoHtml += `<div><p class="text-sm font-semibold text-gray-500">Integrantes</p><ul class="list-disc list-inside mt-1 space-y-1">${details.integrantes.map(int => `<li class="text-gray-700">${int.nombre_completo}</li>`).join('')}</ul></div>`;
    }

    if (details.pagos && details.pagos.length > 0) {
        infoHtml += `<div><p class="text-sm font-semibold text-gray-500">Último Pago</p><p class="text-lg font-medium text-gray-900">$${details.pagos[0].monto} (${details.pagos[0].metodo_pago})</p></div>`;
    }
    infoContainer.innerHTML = infoHtml;

    // Populate QR
    let qrHtml = `<img src="${details.qr_path}?t=${new Date().getTime()}" alt="Código QR" class="w-48 h-48">`;
    if (details.isAdmin) {
        qrHtml += `<a href="${details.qr_path}" download="qr-membresia-${details.id_activa}.png" class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><i class="fas fa-download mr-2"></i>Descargar QR</a>`;
    }
    qrContainer.innerHTML = qrHtml;

    const modalElement = modalClone.firstElementChild;
    document.body.appendChild(modalElement);

    const closeModal = () => modalElement.remove();
    modalElement.querySelectorAll('.close-details-modal').forEach(btn => btn.addEventListener('click', closeModal));
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) closeModal();
    });
  },

  handleViewDetailsClick: function (e) {
    const button = e.currentTarget;
    const id = button.getAttribute("data-id");

    if (!id) {
      console.error("No se encontró el ID de la membresía");
      return;
    }

    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    fetch(`/api/memberships/details/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al cargar los detalles');
        }
        return response.json();
      })
      .then(details => {
        this.showDetailsModal(details);
      })
      .catch(error => {
        console.error("Error al obtener detalles de la membresía:", error);
      })
      .finally(() => {
        button.innerHTML = originalHtml;
        button.disabled = false;
      });
  },

  handleViewMembersClick: function (e) {
    const button = e.currentTarget;
    const idActiva = button.getAttribute("data-id-activa");
    console.log("BOTON PRESIONADO")
    console.log("ID ACTIVA ->", idActiva);

    if (!idActiva) {
      console.error("No se encontró el ID de la membresía activa");
      this.showMessage("No se pudo obtener la información de la membresía", "error");
      return;
    }

    // Mostrar indicador de carga
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    // Hacemos la llamada a la API
    fetch(`/api/memberships/${idActiva}/integrantes`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin' // Asegura que las cookies se envíen con la solicitud
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((integrantes) => {
        console.log("Integrantes recibidos:", integrantes);
        this.showIntegrantesModal(integrantes);
      })
      .catch((error) => {
        console.error("Error al obtener integrantes:", error);
        this.showMessage(`Error al cargar los integrantes: ${error.message}`, "error");
      })
      .finally(() => {
        // Restaurar el botón a su estado original
        button.innerHTML = originalHtml;
        button.disabled = false;
      });
  },

  filterMemberships: function () {
    const searchTerm = this.searchInput
      ? this.searchInput.value.toLowerCase()
      : "";
    const statusValue = this.statusFilter ? this.statusFilter.value : "all";
    const sortValue = this.sortBy ? this.sortBy.value : "expiry";

    this.membershipRows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const statusBadge = row.querySelector(".status-badge");
      let statusMatch = true;

      // Filtrar por estado
      if (statusValue !== "all") {
        if (statusValue === "active") {
          statusMatch =
            statusBadge &&
            statusBadge.textContent.includes("Activa") &&
            !statusBadge.textContent.includes("Vencida");
        } else if (statusValue === "expiring") {
          statusMatch =
            statusBadge && statusBadge.textContent.includes("vencer");
        } else if (statusValue === "expired") {
          statusMatch =
            statusBadge && statusBadge.textContent.includes("Vencida");
        }
      }

      // Filtrar por término de búsqueda
      const searchMatch = searchTerm === "" || text.includes(searchTerm);

      // Mostrar u ocultar fila según los filtros
      if (searchMatch && statusMatch) {
        row.style.display = "";
        row.classList.add("bg-green-100");
        setTimeout(() => row.classList.remove("bg-green-100"), 1000);
      } else {
        row.style.display = "none";
      }
    });

    // Ordenar resultados
    this.sortTable(sortValue);
  },

  sortTable: function (criteria) {
    const tbody = document.getElementById("membershipsTableBody");
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll(".membership-row"));

    rows.sort((a, b) => {
      if (criteria === "name") {
        const nameElementA = a.querySelector(".text-sm.font-semibold");
        const nameElementB = b.querySelector(".text-sm.font-semibold");
        const nameA = nameElementA
          ? nameElementA.textContent.toLowerCase()
          : "";
        const nameB = nameElementB
          ? nameElementB.textContent.toLowerCase()
          : "";
        return nameA.localeCompare(nameB);
      } else if (criteria === "recent") {
        const dateFieldsA = a.querySelectorAll(".date-field");
        const dateFieldsB = b.querySelectorAll(".date-field");
        const dateA =
          dateFieldsA.length > 0
            ? new Date(dateFieldsA[0].getAttribute("data-original"))
            : new Date(0);
        const dateB =
          dateFieldsB.length > 0
            ? new Date(dateFieldsB[0].getAttribute("data-original"))
            : new Date(0);
        return dateB - dateA;
      } else {
        // expiry por defecto
        const daysA = parseInt(a.getAttribute('data-days-until-expiry'), 10);
        const daysB = parseInt(b.getAttribute('data-days-until-expiry'), 10);
        return daysA - daysB;
      }
    });

    // Limpiar y reordenar la tabla
    rows.forEach((row) => tbody.appendChild(row));
  },
};

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});
