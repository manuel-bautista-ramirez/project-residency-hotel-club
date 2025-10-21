// Funciones de utilidad
/**
 * Objeto MembershipUI que encapsula toda la lógica de la interfaz de usuario
 * para la página de listado de membresías.
 */
const MembershipUI = {
  /**
   * Inicializa el módulo, vinculando eventos y aplicando formato inicial a la tabla.
   */
  init: function () {
    this.bindEvents();
    this.applyInitialFormatting();
  },
  /**
   * Asigna todos los manejadores de eventos a los elementos interactivos de la página.
   */
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

    this.typeFilter = document.getElementById("typeFilter");
    this.tableBody = document.getElementById("membershipsTableBody");

    // Búsqueda y filtros
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    if (this.searchInput) {
      this.searchInput.addEventListener("input", debounce(() => this.fetchAndRenderMemberships(), 300));
    }
    if (this.statusFilter) {
      this.statusFilter.addEventListener("change", () => this.fetchAndRenderMemberships());
    }
    if (this.typeFilter) {
      this.typeFilter.addEventListener("change", () => this.fetchAndRenderMemberships());
    }
    if (this.sortBy) {
      this.sortBy.addEventListener("change", () => this.fetchAndRenderMemberships());
    }

    /**
     * Delegación de eventos en el documento. Esto es muy eficiente porque en lugar de
     * añadir un listener a cada botón, se añade uno solo al documento.
     * Luego, se comprueba si el clic ocurrió en un botón de interés ('.view-members-btn' o '.view-details-btn').
     * Es la mejor práctica para manejar eventos en elementos que se cargan dinámicamente o en listas largas.
     */
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

  /**
   * Aplica formato a los datos de la tabla una vez que el DOM está cargado.
   * Mejora la presentación visual de la información.
   */
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

  /**
   * Helper para obtener la primera letra de un nombre en mayúscula.
   */
  getFirstLetter: function (name) {
    return name ? name.charAt(0).toUpperCase() : "";
  },

  /**
   * Helper para formatear una fecha en formato 'dd/mm/aa'.
   */
  formatDate: function (dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  },

  /**
   * Muestra un modal con la lista de integrantes de una membresía.
   * Utiliza un <template> HTML para clonar y poblar el contenido del modal.
   * @param {Array} integrantes - Un array de objetos, cada uno representando un integrante.
   */
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

  /**
   * Muestra un modal con los detalles completos de una membresía, incluyendo el QR.
   * También utiliza un <template> para generar su contenido.
   * @param {Object} details - Un objeto con todos los detalles de la membresía.
   */
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

  /**
   * Manejador para el clic en el botón "Ver Detalles".
   * Realiza una petición fetch a la API para obtener los detalles completos
   * y luego llama a `showDetailsModal` para mostrarlos.
   */
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

  /**
   * Manejador para el clic en el botón "Ver Integrantes".
   * Realiza una petición fetch a la API para obtener la lista de integrantes
   * y luego llama a `showIntegrantesModal` para mostrarlos.
   */
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

  fetchAndRenderMemberships: async function () {
    const searchTerm = this.searchInput.value;
    const status = this.statusFilter.value;
    const type = this.typeFilter.value;
    const sortBy = this.sortBy.value;

    const query = new URLSearchParams({
      search: searchTerm,
      status: status,
      type: type,
      sortBy: sortBy
    });

    try {
      this.tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-10">Cargando...</td></tr>';
      const response = await fetch(`/api/memberships?${query.toString()}`);
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }
      const result = await response.json();
      this.renderTableRows(result.data);
    } catch (error) {
      this.tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-red-500">Error: ${error.message}</td></tr>`;
    }
  },

  renderTableRows: function (memberships) {
    this.tableBody.innerHTML = "";
    if (memberships.length === 0) {
      this.tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-10">No se encontraron membresías.</td></tr>';
      return;
    }

    memberships.forEach(membresia => {
      const row = document.createElement('tr');
      row.className = 'table-row bg-white hover:bg-green-50 transition-all duration-200 group';

      const period = `${this.formatDate(membresia.fecha_inicio)} - ${this.formatDate(membresia.fecha_fin)}`;

      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200 border border-green-200">
                        <span class="text-green-600 font-bold" data-initial="${membresia.nombre_completo}"></span>
                    </div>
                </div>
                <div class="ml-3">
                    <div class="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200">${membresia.nombre_completo}</div>
                    <div class="text-xs text-gray-500 flex items-center mt-1">
                        <i class="fas fa-phone-alt mr-1 text-green-500"></i>${membresia.telefono}
                    </div>
                </div>
            </div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${membresia.tipo_membresia}</div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${period}</div>
        </td>
        <td class="px-4 py-4 whitespace-nowrap">
            <span class="${membresia.statusClass} text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">${membresia.statusText}</span>
        </td>
        <td class="px-4 py-4 whitespace-nowrap">
            <div class="flex items-center space-x-2">
                <a href="/memberships/editMembership/${membresia.id_activa}" class="action-btn bg-amber-100 text-amber-600 hover:bg-amber-200" title="Editar"><i class="fas fa-edit"></i></a>
                <button type="button" class="delete-btn action-btn bg-red-100 text-red-600 hover:bg-red-200" data-id="${membresia.id_activa}" data-name="${membresia.nombre_completo}"><i class="fas fa-trash-alt"></i></button>
            </div>
        </td>
      `;
      this.tableBody.appendChild(row);
    });

    // Volver a aplicar el formato para los nuevos elementos
    this.applyInitialFormatting();
  }
};

/**
 * Punto de entrada del script. Se ejecuta cuando el DOM está completamente cargado.
 */
document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});
