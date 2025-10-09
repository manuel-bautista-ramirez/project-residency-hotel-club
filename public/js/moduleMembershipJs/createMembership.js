// Funciones de utilidad
/**
 * Objeto MembershipUI que encapsula toda la lógica de la interfaz de usuario
 * para la creación de clientes y membresías. Sigue un patrón de módulo para organizar el código.
 */
const MembershipUI = {
  /**
   * Inicializa el módulo. Se encarga de:
   * 1. Cachear los elementos del DOM para un acceso más rápido.
   * 2. Vincular los eventos a los elementos interactivos (botones, formularios, etc.).
   * 3. Establecer la fecha mínima para los inputs de tipo 'date'.
   * 4. Disparar eventos iniciales para configurar el estado inicial de la UI.
   */
  init: function () {
    this.cacheDOM();
    this.bindEvents();
    this.setMinDate();
    this.triggerInitialEvents();

    // Asegura que los campos calculados no puedan ser editados manualmente por el usuario.
    if (this.precioFinalInput) this.precioFinalInput.readOnly = true;
    if (this.fechaFinInput) this.fechaFinInput.readOnly = true;
  },
  /**
   * Guarda referencias a los elementos del DOM en propiedades del objeto.
   * Esto evita repetidas búsquedas en el DOM, mejorando el rendimiento.
   */
  cacheDOM: function () {
    this.formCliente = document.getElementById("form-cliente");
    this.formMembership = document.getElementById("createMemberForm");
    this.clienteMessage = document.getElementById("cliente-message");
    this.membershipMessage = document.getElementById("membership-message");
    this.idClienteInput = document.getElementById("id_cliente");
    this.submitMembershipBtn = document.getElementById("submit-membership");
    this.tipoMembresiaSelect = document.getElementById("tipoMembresia");
    this.integrantesSection = document.getElementById("integrantesSection");
    this.integrantesContainer = document.getElementById("integrantesContainer");
    this.addIntegranteBtn = document.getElementById("addIntegranteBtn");
    this.precioFinalInput = document.getElementById("precioFinal");
    this.precioFinalHidden = document.getElementById("precio_final");
    this.fechaInicioInput = document.getElementById("fecha_inicio");
    this.fechaFinInput = document.getElementById("fecha_fin");
    this.descuentoInput = document.getElementById("descuento");
    this.aplicarDescuentoBtn = document.getElementById("aplicarDescuentoBtn");
    this.clienteModal = document.getElementById("clienteModal");
    this.clienteModalContent = document.getElementById("clienteModalContent");
    this.cancelClienteBtn = document.getElementById("cancelClienteBtn");
    this.confirmClienteBtn = document.getElementById("confirmClienteBtn");
    this.membershipModal = document.getElementById("membershipModal");
    this.membershipModalContent = document.getElementById("membershipModalContent");
    this.cancelMembershipBtn = document.getElementById("cancelMembershipBtn");
    this.confirmMembershipBtn = document.getElementById("confirmMembershipBtn");
    this.maxIntegrantes = 1;
    this.clienteRegistrado = false;
    this.procesandoCliente = false;
    this.procesandoMembresia = false;
  },
  /**
   * Asigna todos los manejadores de eventos a los elementos del DOM cacheados.
   * Centraliza la lógica de interactividad del usuario.
   */
  bindEvents: function () {
    if (this.formCliente) {
      this.formCliente.addEventListener("submit", (e) => {
        e.preventDefault();
        if (this.procesandoCliente) return;
        if (Validator.validateForm(this.formCliente)) {
          this.mostrarModalCliente();
        }
      });
    }
    if (this.confirmClienteBtn) {
      this.confirmClienteBtn.addEventListener("click", () => {
        if (this.procesandoCliente) return;
        this.confirmarCliente();
      });
    }
    if (this.cancelClienteBtn) {
      this.cancelClienteBtn.addEventListener("click", () => {
        this.clienteModal.classList.add("hidden");
      });
    }
    if (this.formMembership) {
      this.formMembership.addEventListener("submit", (e) => {
        e.preventDefault();
        if (this.procesandoMembresia) return;
        if (Validator.validateForm(this.formMembership)) {
          if (!this.clienteRegistrado) {
            this.showMessage(this.membershipMessage, "Debe registrar un cliente primero", "error");
            return;
          }
          this.mostrarModalMembresia();
        }
      });
    }
    if (this.confirmMembershipBtn) {
      this.confirmMembershipBtn.addEventListener("click", () => {
        if (this.procesandoMembresia) return;
        this.confirmarMembresia();
      });
    }
    if (this.cancelMembershipBtn) {
      this.cancelMembershipBtn.addEventListener("click", () => {
        this.membershipModal.classList.add("hidden");
      });
    }
    if (this.tipoMembresiaSelect) {
      this.tipoMembresiaSelect.addEventListener("change", (e) => this.handleTipoMembresiaChange(e));
    }
    if (this.fechaInicioInput) {
      this.fechaInicioInput.addEventListener("change", () => this.updateCalculatedDetails());
    }
    if (this.addIntegranteBtn) {
      this.addIntegranteBtn.addEventListener("click", () => this.agregarIntegrante());
    }
    if (this.aplicarDescuentoBtn) {
      this.aplicarDescuentoBtn.addEventListener("click", () => {
        const descuento = parseInt(this.descuentoInput.value) || 0;
        if (descuento < 0 || descuento > 100) {
          this.showMessage(this.membershipMessage, "El descuento debe estar entre 0 y 100%", "error");
          return;
        }
        this.updateCalculatedDetails();
      });
    }
  },
  /**
   * Establece la fecha mínima permitida en el campo de fecha de inicio,
   * que corresponde al día actual para evitar seleccionar fechas pasadas.
   */
  setMinDate: function () {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    if (this.fechaInicioInput) {
      this.fechaInicioInput.min = `${yyyy}-${mm}-${dd}`;
    }
  },
  /**
   * Dispara eventos iniciales para asegurar que la UI se renderice correctamente
   * al cargar la página. Por ejemplo, calcula el precio y la fecha de fin para
   * la membresía seleccionada por defecto.
   */
  triggerInitialEvents: function () {
    if (this.tipoMembresiaSelect) {
      this.tipoMembresiaSelect.dispatchEvent(new Event("change"));
    }
  },
  /**
   * Muestra un modal de confirmación con los datos del cliente antes de enviarlos al servidor.
   * Permite al usuario verificar la información.
   */
  mostrarModalCliente: function () {
    const formData = new FormData(this.formCliente);
    const nombre = formData.get("nombre_completo");
    const telefono = formData.get("telefono") || "No proporcionado";
    const correo = formData.get("correo");
    this.clienteModalContent.innerHTML = `<p><strong>Nombre:</strong> ${nombre}</p><p><strong>Teléfono:</strong> ${telefono}</p><p><strong>Correo:</strong> ${correo}</p>`;
    this.clienteModal.classList.remove("hidden");
  },
  /**
   * Función asíncrona que se ejecuta al confirmar la creación del cliente.
   * Envía los datos del formulario al servidor usando fetch.
   * Si la respuesta es exitosa, actualiza la UI para permitir la creación de la membresía.
   * Maneja los estados de carga y los posibles errores.
   */
  confirmarCliente: async function () {
    this.procesandoCliente = true;
    this.clienteModal.classList.add("hidden");
    if (this.confirmClienteBtn) this.confirmClienteBtn.disabled = true;
    const submitBtn = this.formCliente.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Procesando...";
      const formData = new FormData(this.formCliente);
      const resp = await fetch(this.formCliente.action, {
        method: "POST",
        body: new URLSearchParams(formData),
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      });
      const responseData = await resp.json();
      if (!resp.ok) throw new Error(responseData.error || responseData.message || "Error desconocido");
      if (responseData.id_cliente) {
        this.idClienteInput.value = responseData.id_cliente;
        this.clienteRegistrado = true;
        this.submitMembershipBtn.disabled = false;
        this.submitMembershipBtn.classList.remove("bg-gray-400", "hover:bg-gray-400", "focus:ring-gray-400");
        this.submitMembershipBtn.classList.add("bg-green-600", "hover:bg-green-700", "focus:ring-green-500");
        this.submitMembershipBtn.textContent = "Crear Membresía";
        this.showMessage(this.clienteMessage, "Cliente registrado con éxito. Ahora puede crear la membresía.", "success");
        if (this.formMembership) this.formMembership.scrollIntoView({ behavior: "smooth" });
      } else {
        throw new Error("No se recibió un ID de cliente válido");
      }
    } catch (err) {
      this.showMessage(this.clienteMessage, `Error: ${err.message}`, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      this.procesandoCliente = false;
      if (this.confirmClienteBtn) this.confirmClienteBtn.disabled = false;
    }
  },
  /**
   * Muestra un modal de confirmación con el resumen de la membresía
   * antes de finalizar la creación.
   */
  mostrarModalMembresia: function () {
    const formData = new FormData(this.formMembership);
    const tipoMembresiaText = this.tipoMembresiaSelect.options[this.tipoMembresiaSelect.selectedIndex].text;
    const fechaInicio = formData.get("fecha_inicio");
    const fechaFin = this.fechaFinInput.value;
    const metodoPagoText = document.getElementById("metodo_pago").options[document.getElementById("metodo_pago").selectedIndex].text;
    const precioFinal = this.precioFinalInput.value;
    let integrantesHTML = "";
    const integrantes = document.querySelectorAll('input[name="integrantes[]"]');
    if (integrantes.length > 0) {
      integrantesHTML = '<p><strong>Integrantes:</strong></p><ul class="list-disc pl-5 mt-1">';
      integrantes.forEach((integrante) => { integrantesHTML += `<li>${integrante.value}</li>`; });
      integrantesHTML += "</ul>";
    }
    const descuentoAplicado = parseInt(this.descuentoInput.value) || 0;
    this.membershipModalContent.innerHTML = `<p><strong>Tipo de membresía:</strong> ${tipoMembresiaText}</p><p><strong>Fecha de inicio:</strong> ${fechaInicio}</p><p><strong>Fecha de fin:</strong> ${fechaFin}</p><p><strong>Método de pago:</strong> ${metodoPagoText}</p><p><strong>Precio final:</strong> ${precioFinal}</p>${integrantesHTML}${descuentoAplicado > 0 ? `<p><strong>Descuento aplicado:</strong> ${descuentoAplicado}%</p>` : ""}`;
    this.membershipModal.classList.remove("hidden");
  },
  /**
   * Función asíncrona que envía los datos del formulario de membresía al servidor.
   * Si la creación es exitosa, invoca a `mostrarModalExito` para mostrar los resultados.
   * Deshabilita los formularios para prevenir envíos duplicados.
   * Gestiona los estados de carga y errores.
   */
  confirmarMembresia: async function () {
    this.procesandoMembresia = true;
    this.membershipModal.classList.add("hidden");
    if (this.confirmMembershipBtn) this.confirmMembershipBtn.disabled = true;
    const submitBtn = this.formMembership.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Procesando...";
      const formData = new FormData(this.formMembership);
      const resp = await fetch(this.formMembership.action, {
        method: "POST",
        body: new URLSearchParams(formData),
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      });
      const responseData = await resp.json();
      if (!resp.ok) throw new Error(responseData.error || "Error HTTP " + resp.status);
      if (responseData.success) {
        this.mostrarModalExito(responseData.data);
        this.formMembership.classList.add("opacity-50");
        this.formMembership.querySelectorAll("input, select, button").forEach((el) => { el.disabled = true; });
      } else {
        throw new Error(responseData.message || "Error desconocido");
      }
    } catch (err) {
      this.showMessage(this.membershipMessage, "Error al crear membresía: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      this.procesandoMembresia = false;
      if (this.confirmMembershipBtn) this.confirmMembershipBtn.disabled = false;
    }
  },
  /**
   * Muestra un modal de éxito después de crear la membresía.
   * Clona un template HTML, lo rellena con los datos recibidos del servidor (incluyendo el QR),
   * y lo añade al DOM. También configura los botones de "Cerrar" y "Ver Lista".
   * @param {object} data - Los datos de la membresía creada, devueltos por el servidor.
   */
  mostrarModalExito: function (data) {
    const template = document.getElementById('success-modal-template');
    if (!template) return;
    const modalClone = template.content.cloneNode(true);
    const infoContainer = modalClone.querySelector('[data-template-content="info"]');
    infoContainer.innerHTML = `<p><strong>Titular:</strong> ${data.titular}</p><p><strong>Tipo de membresía:</strong> ${data.tipo_membresia}</p><p><strong>Fecha de inicio:</strong> ${data.fecha_inicio}</p><p><strong>Fecha de expiración:</strong> ${data.fecha_fin}</p><p><strong>Método de pago:</strong> ${data.metodo_pago}</p><p><strong>Total pagado:</strong> $${data.precio_final.toFixed(2)}</p><p><strong>Total en letras:</strong> ${data.precioEnLetras}</p>`;
    const integrantesContainer = modalClone.querySelector('[data-template-content="integrantes"]');
    if (data.integrantes && data.integrantes.length > 0) {
      integrantesContainer.innerHTML = `<h4 class="font-medium text-green-700 mb-2">Integrantes:</h4><ul class="list-disc pl-5">${data.integrantes.map((i) => `<li>${i.nombre_completo}</li>`).join("")}</ul>`;
    }
    const qrImage = modalClone.getElementById('qrImage');
    qrImage.src = `${data.qr_path}?t=${new Date().getTime()}`;
    qrImage.alt = `QR de membresía ${data.titular}`;
    const downloadContainer = modalClone.querySelector('[data-template-content="qr-download"]');
    const downloadButton = document.createElement('button');
    downloadButton.className = "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500";
    downloadButton.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>Descargar QR`;
    downloadButton.onclick = () => this.descargarQR(data.id_activa);
    downloadContainer.appendChild(downloadButton);
    const modalElement = modalClone.firstElementChild;
    document.body.appendChild(modalElement);
    modalElement.querySelector('[data-action="close"]').addEventListener('click', () => {
      modalElement.remove();
      this.limpiarFormularios();
    });
    modalElement.querySelector('[data-action="view-list"]').addEventListener('click', () => {
      window.location.href = '/memberships/listMembership';
    });
  },
  /**
   * Inicia la descarga del archivo de imagen del código QR.
   * @param {number} id_activa - El ID de la membresía activa para construir la URL de descarga.
   */
  descargarQR: function (id_activa) {
    const link = document.createElement("a");
    link.href = `/memberships/download-qr/${id_activa}`;
    link.download = `membresia_${id_activa}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  /**
   * Limpia y resetea ambos formularios a su estado inicial,
   * permitiendo registrar un nuevo cliente y membresía.
   */
  limpiarFormularios: function () {
    if (this.formCliente) this.formCliente.reset();
    if (this.formMembership) {
      this.formMembership.reset();
      this.integrantesContainer.innerHTML = "";
      this.integrantesSection.classList.add("hidden");
    }
    this.clienteRegistrado = false;
    this.submitMembershipBtn.disabled = true;
    this.submitMembershipBtn.classList.remove("bg-green-600", "hover:bg-green-700", "focus:ring-green-500");
    this.submitMembershipBtn.classList.add("bg-gray-400", "hover:bg-gray-400", "focus:ring-gray-400");
    this.submitMembershipBtn.textContent = "Crear Membresía (complete primero el cliente)";
  },
  /**
   * Realiza una llamada a una API en el backend para calcular dinámicamente
   * la fecha de fin y el precio final de la membresía.
   * Se ejecuta cuando cambia el tipo de membresía, la fecha de inicio o se aplica un descuento.
   * Esto centraliza la lógica de negocio en el servidor.
   */
  updateCalculatedDetails: async function () {
    const id_tipo_membresia = this.tipoMembresiaSelect.value;
    const fecha_inicio = this.fechaInicioInput.value;
    const descuento = this.descuentoInput ? parseInt(this.descuentoInput.value) || 0 : 0;
    if (!id_tipo_membresia || !fecha_inicio) return;
    try {
      this.showMessage(this.membershipMessage, "Calculando...", "success");
      const resp = await fetch("/memberships/api/calculate-details", {
        method: "POST",
        body: JSON.stringify({ id_tipo_membresia, fecha_inicio, descuento }),
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Error del servidor");
      this.precioFinalInput.value = data.precio_final;
      this.precioFinalHidden.value = data.precio_final;
      this.fechaFinInput.value = data.fecha_fin;
      this.membershipMessage.classList.add("hidden");
    } catch (err) {
      this.showMessage(this.membershipMessage, `Error: ${err.message}`, "error");
    }
  },
  /**
   * Manejador para el evento 'change' del selector de tipo de membresía.
   * Actualiza el número máximo de integrantes permitidos y muestra u oculta
   * la sección para agregar integrantes según el tipo de membresía.
   */
  handleTipoMembresiaChange: function (e) {
    const selectedOption = e.target.options[e.target.selectedIndex];
    this.maxIntegrantes = parseInt(selectedOption.dataset.max, 10);
    this.updateCalculatedDetails();
    if (this.maxIntegrantes > 1) {
      this.integrantesSection.classList.remove("hidden");
      if (this.integrantesContainer.children.length === 0) {
        this.addIntegranteBtn.click();
      }
    } else {
      this.integrantesSection.classList.add("hidden");
      this.integrantesContainer.innerHTML = "";
    }
  },
  /**
   * Añade dinámicamente un nuevo campo de texto para registrar un integrante familiar.
   * Valida que no se exceda el número máximo de integrantes permitidos.
   * Asigna un evento al botón de eliminar para quitar el campo recién creado.
   */
  agregarIntegrante: function () {
    const currentIntegrantes = this.integrantesContainer.querySelectorAll(".integrante").length;
    if (currentIntegrantes < this.maxIntegrantes - 1) {
      const integranteDiv = document.createElement("div");
      integranteDiv.classList.add("integrante", "flex", "items-center", "space-x-2", "mb-2");
      integranteDiv.innerHTML = `<input type="text" name="integrantes[]" placeholder="Nombre completo del integrante" required class="flex-1 px-3 py-2 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"><button type="button" class="removeBtn px-3 py-2 border border-transparent rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">❌ Eliminar</button>`;
      this.integrantesContainer.appendChild(integranteDiv);
      integranteDiv.querySelector(".removeBtn").addEventListener("click", () => {
        integranteDiv.remove();
        const remaining = this.maxIntegrantes - 1 - this.integrantesContainer.querySelectorAll(".integrante").length;
        if (remaining > 0) {
          this.showMessage(this.membershipMessage, `Puede agregar hasta ${remaining} integrantes más`, "success");
          setTimeout(() => { this.membershipMessage.classList.add("hidden"); }, 3000);
        }
      });
    } else {
      this.showMessage(this.membershipMessage, `Máximo ${this.maxIntegrantes - 1} integrantes adicionales permitidos`, "error");
      setTimeout(() => { this.membershipMessage.classList.add("hidden"); }, 3000);
    }
  },
  /**
   * Función de utilidad para mostrar mensajes de feedback (éxito o error) al usuario.
   * El mensaje desaparece automáticamente después de 5 segundos.
   * @param {HTMLElement} element - El elemento del DOM donde se mostrará el mensaje.
   * @param {string} text - El texto del mensaje.
   * @param {string} type - El tipo de mensaje ('success' o 'error') para aplicar el estilo correcto.
   */
  showMessage: function (element, text, type) {
    element.textContent = text;
    element.classList.remove("hidden", "text-green-600", "text-red-600");
    if (type === "success") {
      element.classList.add("text-green-600");
    } else {
      element.classList.add("text-red-600");
    }
    setTimeout(() => {
      element.classList.add("hidden");
    }, 5000);
  },
};

/**
 * Punto de entrada del script.
 * Se asegura de que el DOM esté completamente cargado antes de ejecutar la lógica de inicialización.
 */
document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});