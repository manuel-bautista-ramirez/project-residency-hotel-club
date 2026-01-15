import { Validator } from './validator.js';

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
    this.bindInputFiltering();
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
   * Muestra un spinner en un botón usando el helper global.
   */
  startLoading: function (button, text = 'Procesando...') {
    this._originalBtnHtml = window.setLoadingState(button, text);
  },

  /**
   * Restaura el contenido original de un botón usando el helper global.
   */
  stopLoading: function (button) {
    window.removeLoadingState(button, this._originalBtnHtml);
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
            this.showMessage(null, "Debe registrar un cliente primero", "error");
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
          this.showMessage(null, "El descuento debe estar entre 0 y 100%", "error");
          return;
        }
        this.updateCalculatedDetails();
      });
    }
  },
  /**
   * Establece la fecha mínima permitida en el campo de fecha de inicio.
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
   * Dispara eventos iniciales para asegurar que la UI se renderice correctamente.
   */
  triggerInitialEvents: function () {
    if (this.tipoMembresiaSelect) {
      this.tipoMembresiaSelect.dispatchEvent(new Event("change"));
    }
  },
  /**
   * Muestra un modal de confirmación con los datos del cliente.
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
   */
  confirmarCliente: async function () {
    this.procesandoCliente = true;
    this.clienteModal.classList.add("hidden");
    if (this.confirmClienteBtn) this.confirmClienteBtn.disabled = true;
    const submitBtn = this.formCliente.querySelector('button[type="submit"]');

    this.startLoading(submitBtn, 'Verificando...');

    try {
      // Paso 1: Validar si el cliente ya existe
      const formData = new FormData(this.formCliente);
      const validationResp = await fetch('/api/memberships/validate-client', {
        method: 'POST',
        body: new URLSearchParams(formData),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const validationData = await validationResp.json();

      if (!validationResp.ok) {
        throw new Error(validationData.error || 'Error al validar el cliente.');
      }

      // Paso 2: Manejar la respuesta de la validación
      if (validationData.status === 'active') {
        this.showMessage(null, 'Este cliente ya tiene una membresía activa. No se puede crear una nueva.', 'error');
        return;
      }

      if (validationData.status === 'inactive') {
        this.showMessage(null, 'Este cliente tiene una membresía inactiva. Será redirigido a la página de renovación.', 'warning');
        setTimeout(() => {
          window.location.href = `/memberships/renew/${validationData.id_activa}`;
        }, 3000);
        return;
      }

      // Paso 3: Si el cliente no existe (not_found), proceder con la creación
      const createResp = await fetch(this.formCliente.action, {
        method: "POST",
        body: new URLSearchParams(formData),
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      });
      const createData = await createResp.json();
      if (!createResp.ok) throw new Error(createData.error || createData.message || "Error desconocido al crear el cliente");

      if (createData.id_cliente) {
        this.idClienteInput.value = createData.id_cliente;
        this.clienteRegistrado = true;
        this.submitMembershipBtn.disabled = false;
        this.submitMembershipBtn.classList.remove("bg-gray-400", "hover:bg-gray-400");
        this.submitMembershipBtn.classList.add("bg-green-600", "hover:bg-green-700");
        this.submitMembershipBtn.textContent = "Crear Membresía";
        this.showMessage(null, "Cliente registrado con éxito. Procede con la membresía.", "success");

        if (this.formMembership) this.formMembership.parentElement.classList.remove('hidden');
        if (this.formCliente) this.formCliente.parentElement.classList.add('hidden');
        if (this.formMembership) this.formMembership.scrollIntoView({ behavior: "smooth" });
      } else {
        throw new Error("No se recibió un ID de cliente válido");
      }
    } catch (err) {
      this.showMessage(null, `Error: ${err.message}`, "error");
    } finally {
      this.stopLoading(submitBtn);
      this.procesandoCliente = false;
      if (this.confirmClienteBtn) this.confirmClienteBtn.disabled = false;
    }
  },
  /**
   * Muestra un modal de confirmación con el resumen de la membresía.
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
   */
  confirmarMembresia: async function () {
    this.procesandoMembresia = true;
    this.membershipModal.classList.add("hidden");
    if (this.confirmMembershipBtn) this.confirmMembershipBtn.disabled = true;
    const submitBtn = this.formMembership.querySelector('button[type="submit"]');

    this.startLoading(submitBtn, 'Procesando...');

    try {
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
      this.showMessage(null, "Error al crear membresía: " + err.message, "error");
    } finally {
      this.stopLoading(submitBtn);
      this.procesandoMembresia = false;
      if (this.confirmMembershipBtn) this.confirmMembershipBtn.disabled = false;
    }
  },

  /**
   * Muestra un modal de éxito después de crear la membresía.
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

    // Configurar botones del clon
    const modalElement = modalClone.firstElementChild;
    document.body.appendChild(modalElement);

    const downloadBtn = modalElement.querySelector('button[data-action="download-qr"]') || document.createElement('button');
    downloadBtn.onclick = () => this.descargarQR(data.id_activa);

    modalElement.querySelector('[data-action="close"]').addEventListener('click', () => {
      modalElement.remove();
      window.location.reload();
    });
    modalElement.querySelector('[data-action="view-list"]').addEventListener('click', () => {
      window.location.href = '/memberships/listMembership';
    });
  },

  /**
   * Inicia la descarga del archivo de imagen del código QR.
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
   * Actualiza dinámicamente la fecha de fin y el precio final de la membresía.
   */
  updateCalculatedDetails: async function () {
    const id_tipo_membresia = this.tipoMembresiaSelect.value;
    const fecha_inicio = this.fechaInicioInput.value;
    const descuento = this.descuentoInput ? parseInt(this.descuentoInput.value) || 0 : 0;
    if (!id_tipo_membresia || !fecha_inicio) return;
    try {
      if (this.submitMembershipBtn) this.submitMembershipBtn.disabled = true;
      this.showMessage(null, "Calculando detalles...", "info");

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
    } catch (err) {
      this.showMessage(null, `Error: ${err.message}`, "error");
    } finally {
      if (this.submitMembershipBtn && this.clienteRegistrado) this.submitMembershipBtn.disabled = false;
    }
  },

  /**
   * Manejador para el cambio de tipo de membresía.
   */
  handleTipoMembresiaChange: function (e) {
    const selectedOption = e.target.options[e.target.selectedIndex];
    this.maxIntegrantes = parseInt(selectedOption.dataset.max, 10);
    this.updateCalculatedDetails();
    this.integrantesContainer.innerHTML = "";
    if (this.maxIntegrantes > 1) {
      this.integrantesSection.classList.remove("hidden");
      const numIntegrantesAdicionales = this.maxIntegrantes - 1;
      for (let i = 0; i < numIntegrantesAdicionales; i++) {
        this.agregarIntegrante(false);
      }
      const headerText = this.integrantesSection.querySelector('h4');
      if (headerText) {
        headerText.innerHTML = `<i class="fas fa-users mr-2"></i>Integrantes adicionales (${numIntegrantesAdicionales} requeridos)`;
      }
    } else {
      this.integrantesSection.classList.add("hidden");
    }
  },

  /**
   * Añade un campo para integrante.
   */
  agregarIntegrante: function (showRemoveButton = true) {
    const currentIntegrantes = this.integrantesContainer.querySelectorAll(".integrante").length;
    const integranteDiv = document.createElement("div");
    integranteDiv.classList.add("integrante", "flex", "items-center", "space-x-2", "mb-2");
    let inputHTML = `<input type="text" name="integrantes[]" placeholder="Nombre completo del integrante #${currentIntegrantes + 1}" required class="flex-1 px-3 py-2 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">`;
    integranteDiv.innerHTML = inputHTML;
    this.integrantesContainer.appendChild(integranteDiv);
  },

  /**
   * Vincula los eventos de filtrado de entrada.
   */
  bindInputFiltering: function () {
    const filterInput = (inputElement, regex) => {
      inputElement.addEventListener('input', (e) => {
        const val = e.target.value.replace(regex, '');
        if (e.target.value !== val) e.target.value = val;
      });
    };
    const nombreInput = this.formCliente.querySelector('[name="nombre_completo"]');
    const telInput = this.formCliente.querySelector('[name="telefono"]');
    if (nombreInput) filterInput(nombreInput, /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g);
    if (telInput) {
      telInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (e.target.value !== val) e.target.value = val;
      });
    }
  },

  /**
   * Función de feedback global.
   */
  showMessage: function (element, text, type) {
    if (typeof window.showNotification === 'function') {
      window.showNotification(text, type);
    }
  },
};

document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});
