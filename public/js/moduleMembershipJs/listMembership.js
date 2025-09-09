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
    // Verificar si hay integrantes
    if (!integrantes || integrantes.length === 0) {
      this.showMessage(
        "Esta membresía no tiene integrantes registrados",
        "info"
      );
      return;
    }

    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 integrantes-modal">
            <div class="bg-white rounded-2xl p-6 w-11/12 md:w-96 max-w-90vw">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-users mr-2 text-purple-500"></i>Integrantes de la Membresía
                </h3>
                <div class="max-h-60 overflow-y-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr>
                                <th class="text-left text-sm font-medium text-purple-700 py-2">Nombre</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${integrantes
                              .map(
                                (int) => `
                                <tr>
                                    <td class="py-2">
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                                <span class="text-purple-600 font-bold">${this.getFirstLetter(
                                                  int.nombre_completo
                                                )}</span>
                                            </div>
                                            <span class="text-sm text-gray-700">${
                                              int.nombre_completo ||
                                              "Sin nombre"
                                            }</span>
                                        </div>
                                    </td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
                <div class="mt-4 flex justify-end">
                    <button class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors close-integrantes-modal">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si hay uno
    const existingModal = document.querySelector(".integrantes-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // Insertar el modal en el documento
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Cerrar modal al hacer clic en el botón de cerrar
    document
      .querySelector(".close-integrantes-modal")
      .addEventListener("click", function () {
        document.querySelector(".integrantes-modal").remove();
      });

    // Cerrar modal al hacer clic fuera del contenido
    document
      .querySelector(".integrantes-modal")
      .addEventListener("click", function (e) {
        if (e.target === this) {
          this.remove();
        }
      });

    // Cerrar modal con la tecla ESC
    document.addEventListener("keydown", function handleEsc(e) {
      if (e.key === "Escape") {
        const modal = document.querySelector(".integrantes-modal");
        if (modal) {
          modal.remove();
          document.removeEventListener("keydown", handleEsc);
        }
      }
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
        const statusBadgeA = a.querySelector(".status-badge");
        const statusBadgeB = b.querySelector(".status-badge");
        const daysA = this.extractDays(
          statusBadgeA ? statusBadgeA.textContent : ""
        );
        const daysB = this.extractDays(
          statusBadgeB ? statusBadgeB.textContent : ""
        );
        return daysA - daysB;
      }
    });

    // Limpiar y reordenar la tabla
    rows.forEach((row) => tbody.appendChild(row));
  },

  extractDays: function (text) {
    if (!text) return 999;

    const match = text.match(/(\d+)\s*días/);
    if (match) return parseInt(match[1]);

    if (text.includes("Vencida")) return -1;
    if (text.includes("Inactiva")) return -2;

    return 999; // Para membresías activas sin contador específico
  },
};

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});
