// Funciones de utilidad
const MembershipUI = {
  init: function () {
    this.cacheDOM(); // 1. Guardar elementos del DOM
    this.bindEvents(); // 2. Asignar eventos
    this.setMinDate();
    this.triggerInitialEvents();

    // Hacer campos calculados de solo lectura
    if (this.precioFinalInput) this.precioFinalInput.readOnly = true;
    if (this.fechaFinInput) this.fechaFinInput.readOnly = true;
  },

  // 1. Guardar todos los elementos en un solo lugar
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
    this.membershipModalContent = document.getElementById(
      "membershipModalContent"
    );
    this.cancelMembershipBtn = document.getElementById("cancelMembershipBtn");
    this.confirmMembershipBtn = document.getElementById("confirmMembershipBtn");

    // Variables de estado
    this.maxIntegrantes = 1;
    this.clienteRegistrado = false;
    this.duracionDias = 30;
    this.precioBase = 0;
    this.descuentoAplicado = 0;
    this.procesandoCliente = false;
    this.procesandoMembresia = false;
  },

  // 2. Asignar todos los eventos
  bindEvents: function () {
    // Manejar envío del formulario de cliente
    if (this.formCliente) {
      this.formCliente.addEventListener("submit", (e) => {
        e.preventDefault();
        if (this.procesandoCliente) {
          console.log("⚠️ Ya se está procesando un cliente, ignorando envío");
          return;
        }
        // ✅ INTEGRACIÓN: Primero valida, y solo si es válido, muestra el modal.
        if (Validator.validateForm(this.formCliente)) {
          this.mostrarModalCliente();
        }
      });
    }

    // Confirmar creación de cliente
    if (this.confirmClienteBtn) {
      this.confirmClienteBtn.addEventListener("click", () => {
        if (this.procesandoCliente) {
          console.log("⚠️ Ya se está procesando un cliente, ignorando clic");
          return;
        }
        this.confirmarCliente();
      });
    }

    // Cancelar creación de cliente
    if (this.cancelClienteBtn) {
      this.cancelClienteBtn.addEventListener("click", () => {
        this.clienteModal.classList.add("hidden");
      });
    }

    // Manejar envío del formulario de membresía
    if (this.formMembership) {
      this.formMembership.addEventListener("submit", (e) => {
        e.preventDefault();
        if (this.procesandoMembresia) {
          console.log(
            "⚠️ Ya se está procesando una membresía, ignorando envío"
          );
          return;
        }
        // ✅ INTEGRACIÓN EN EL SEGUNDO FORMULARIO
        if (Validator.validateForm(this.formMembership)) {
          // Lógica adicional del formulario de membresía
          if (!this.clienteRegistrado) {
            this.showMessage(
              this.membershipMessage,
              "Debe registrar un cliente primero",
              "error"
            );
            return;
          }
          this.mostrarModalMembresia();
        }
      });
    }

    // Confirmar creación de membresía
    if (this.confirmMembershipBtn) {
      this.confirmMembershipBtn.addEventListener("click", () => {
        if (this.procesandoMembresia) {
          console.log("⚠️ Ya se está procesando una membresía, ignorando clic");
          return;
        }
        this.confirmarMembresia();
      });
    }

    // Cancelar creación de membresía
    if (this.cancelMembershipBtn) {
      this.cancelMembershipBtn.addEventListener("click", () => {
        this.membershipModal.classList.add("hidden");
      });
    }

    // Manejar cambio en el tipo de membresía
    if (this.tipoMembresiaSelect) {
      this.tipoMembresiaSelect.addEventListener("change", (e) => {
        this.handleTipoMembresiaChange(e);
      });
    }

    // Recalcular cuando cambia la fecha de inicio
    if (this.fechaInicioInput) {
      this.fechaInicioInput.addEventListener("change", () => {
        this.updateCalculatedDetails();
      });
    }

    // Botón para agregar integrantes
    if (this.addIntegranteBtn) {
      this.addIntegranteBtn.addEventListener("click", () => {
        this.agregarIntegrante();
      });
    }

    // Recalcular cuando se aplica un descuento
    if (this.aplicarDescuentoBtn) {
      this.aplicarDescuentoBtn.addEventListener("click", () => {
        const descuento = parseInt(this.descuentoInput.value) || 0;
        if (descuento < 0 || descuento > 100) {
          this.showMessage(
            this.membershipMessage,
            "El descuento debe estar entre 0 y 100%",
            "error"
          );
          return;
        }
        this.updateCalculatedDetails();
      });
    }
  },

  // 3. El resto de las funciones se mantienen igual
  setMinDate: function () {
    // Establecer fecha mínima como hoy
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    if (this.fechaInicioInput) {
      this.fechaInicioInput.min = `${yyyy}-${mm}-${dd}`;
    }
  },

  triggerInitialEvents: function () {
    // Disparar evento inicial
    if (this.tipoMembresiaSelect) {
      this.tipoMembresiaSelect.dispatchEvent(new Event("change"));
    }
  },

  mostrarModalCliente: function () {
    const formData = new FormData(this.formCliente);
    const nombre = formData.get("nombre_completo");
    const telefono = formData.get("telefono") || "No proporcionado";
    const correo = formData.get("correo");

    this.clienteModalContent.innerHTML = `
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Teléfono:</strong> ${telefono}</p>
          <p><strong>Correo:</strong> ${correo}</p>
      `;

    this.clienteModal.classList.remove("hidden");
  },

  confirmarCliente: async function () {
    if (this.procesandoCliente) {
      console.log("⚠️ Ya se está procesando un cliente, ignorando doble clic");
      return;
    }

    this.procesandoCliente = true;
    this.clienteModal.classList.add("hidden");

    if (this.confirmClienteBtn) {
      this.confirmClienteBtn.disabled = true;
    }

    const submitBtn = this.formCliente.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Procesando...";

      const formData = new FormData(this.formCliente);

      const resp = await fetch(this.formCliente.action, {
        method: "POST",
        body: new URLSearchParams(formData),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const responseData = await resp.json();

      if (!resp.ok) {
        const errorMsg =
          responseData.error || responseData.message || "Error desconocido";
        throw new Error(errorMsg);
      }

      if (responseData.id_cliente) {
        this.idClienteInput.value = responseData.id_cliente;
        this.clienteRegistrado = true;

        this.submitMembershipBtn.disabled = false;
        this.submitMembershipBtn.classList.remove(
          "bg-gray-400",
          "hover:bg-gray-400",
          "focus:ring-gray-400"
        );
        this.submitMembershipBtn.classList.add(
          "bg-green-600",
          "hover:bg-green-700",
          "focus:ring-green-500"
        );
        this.submitMembershipBtn.textContent = "Crear Membresía";

        this.showMessage(
          this.clienteMessage,
          "Cliente registrado con éxito. Ahora puede crear la membresía.",
          "success"
        );

        if (this.formMembership) {
          this.formMembership.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        throw new Error("No se recibió un ID de cliente válido");
      }
    } catch (err) {
      console.error("Error al registrar cliente:", err);
      this.showMessage(this.clienteMessage, `Error: ${err.message}`, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      this.procesandoCliente = false;

      if (this.confirmClienteBtn) {
        this.confirmClienteBtn.disabled = false;
      }
    }
  },

  mostrarModalMembresia: function () {
    const formData = new FormData(this.formMembership);
    const tipoMembresiaText =
      this.tipoMembresiaSelect.options[this.tipoMembresiaSelect.selectedIndex]
        .text;
    const fechaInicio = formData.get("fecha_inicio");
    const fechaFin = this.fechaFinInput.value;
    const metodoPagoText =
      document.getElementById("metodo_pago").options[
        document.getElementById("metodo_pago").selectedIndex
      ].text;
    const precioFinal = this.precioFinalInput.value;

    let integrantesHTML = "";
    const integrantes = document.querySelectorAll(
      'input[name="integrantes[]"]'
    );

    if (integrantes.length > 0) {
      integrantesHTML =
        '<p><strong>Integrantes:</strong></p><ul class="list-disc pl-5 mt-1">';
      integrantes.forEach((integrante) => {
        integrantesHTML += `<li>${integrante.value}</li>`;
      });
      integrantesHTML += "</ul>";
    }

    this.membershipModalContent.innerHTML = `
          <p><strong>Tipo de membresía:</strong> ${tipoMembresiaText}</p>
          <p><strong>Fecha de inicio:</strong> ${fechaInicio}</p>
          <p><strong>Fecha de fin:</strong> ${fechaFin}</p>
          <p><strong>Método de pago:</strong> ${metodoPagoText}</p>
          <p><strong>Precio final:</strong> ${precioFinal}</p>
          ${integrantesHTML}
          ${
            this.descuentoAplicado > 0
              ? `<p><strong>Descuento aplicado:</strong> ${this.descuentoAplicado}%</p>`
              : ""
          }
      `;

    this.membershipModal.classList.remove("hidden");
  },

  confirmarMembresia: async function () {
    if (this.procesandoMembresia) {
      console.log(
        "⚠️ Ya se está procesando una membresía, ignorando doble clic"
      );
      return;
    }

    this.procesandoMembresia = true;
    this.membershipModal.classList.add("hidden");

    if (this.confirmMembershipBtn) {
      this.confirmMembershipBtn.disabled = true;
    }

    const submitBtn = this.formMembership.querySelector(
      'button[type="submit"]'
    );
    const originalBtnText = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Procesando...";

      const idClienteValue = this.idClienteInput.value;
      if (!idClienteValue || isNaN(idClienteValue)) {
        this.showMessage(
          this.membershipMessage,
          "Error: ID de cliente inválido. Por favor, registre el cliente nuevamente.",
          "error"
        );
        this.procesandoMembresia = false;
        if (this.confirmMembershipBtn) {
          this.confirmMembershipBtn.disabled = false;
        }
        return;
      }

      const fechaInicio = new Date(this.fechaInicioInput.value);
      if (fechaInicio < new Date().setHours(0, 0, 0, 0)) {
        this.showMessage(
          this.membershipMessage,
          "Error: La fecha de inicio no puede ser anterior a hoy",
          "error"
        );
        this.procesandoMembresia = false;
        if (this.confirmMembershipBtn) {
          this.confirmMembershipBtn.disabled = false;
        }
        return;
      }

      if (this.maxIntegrantes > 1) {
        const integrantes = document.querySelectorAll(
          'input[name="integrantes[]"]'
        );
        if (integrantes.length === 0) {
          this.showMessage(
            this.membershipMessage,
            "Error: Debe agregar al menos un integrante familiar",
            "error"
          );
          this.procesandoMembresia = false;
          if (this.confirmMembershipBtn) {
            this.confirmMembershipBtn.disabled = false;
          }
          return;
        }

        for (let integrante of integrantes) {
          if (!integrante.value.trim()) {
            this.showMessage(
              this.membershipMessage,
              "Error: Todos los integrantes deben tener un nombre",
              "error"
            );
            this.procesandoMembresia = false;
            if (this.confirmMembershipBtn) {
              this.confirmMembershipBtn.disabled = false;
            }
            return;
          }
        }
      }

      const formData = new FormData(this.formMembership);
      console.log("📤 Enviando datos de membresía...");

      const resp = await fetch(this.formMembership.action, {
        method: "POST",
        body: new URLSearchParams(formData),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const responseData = await resp.json();
      console.log("📥 Respuesta recibida:", responseData);

      if (!resp.ok) {
        throw new Error(responseData.error || "Error HTTP " + resp.status);
      }

      if (responseData.success) {
        // Mostrar el modal de éxito con la información de la membresía
        this.mostrarModalExito(responseData.data);

        // Deshabilitar el formulario temporalmente para prevenir reenvíos
        this.formMembership.classList.add("opacity-50");
        this.formMembership
          .querySelectorAll("input, select, button")
          .forEach((el) => {
            el.disabled = true;
          });
      } else {
        throw new Error(responseData.message || "Error desconocido");
      }
    } catch (err) {
      console.error("Error completo:", err);
      this.showMessage(
        this.membershipMessage,
        "Error al crear membresía: " + err.message,
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      this.procesandoMembresia = false;

      if (this.confirmMembershipBtn) {
        this.confirmMembershipBtn.disabled = false;
      }
    }
  },

  // Método para mostrar el modal de éxito con QR
  mostrarModalExito: function (data) {
    // Convertir número a letras
    const convertirNumeroALetras = (numero) => {
      const unidades = [
        "",
        "uno",
        "dos",
        "tres",
        "cuatro",
        "cinco",
        "seis",
        "siete",
        "ocho",
        "nueve",
      ];
      const decenas = [
        "",
        "",
        "veinte",
        "treinta",
        "cuarenta",
        "cincuenta",
        "sesenta",
        "setenta",
        "ochenta",
        "noventa",
      ];

      if (numero === 0) return "cero";
      if (numero < 10) return unidades[numero];
      if (numero < 100) {
        const dec = Math.floor(numero / 10);
        const uni = numero % 10;
        return decenas[dec] + (uni > 0 ? " y " + unidades[uni] : "");
      }
      return numero.toString();
    };

    const precioEnLetras =
      convertirNumeroALetras(Math.floor(data.precio_final)) + " pesos";

    let integrantesHTML = "";
    if (data.integrantes && data.integrantes.length > 0) {
      integrantesHTML = `
              <div class="mt-4">
                  <h4 class="font-medium text-green-700 mb-2">Integrantes:</h4>
                  <ul class="list-disc pl-5">
                      ${data.integrantes
                        .map((i) => `<li>${i.nombre_completo}</li>`)
                        .join("")}
                  </ul>
              </div>
          `;
    }

    // Crear el modal de éxito
    const modalHTML = `
          <div id="successModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div class="text-center mb-6">
                      <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                          <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                      </div>
                      <h3 class="text-lg font-bold text-green-800">¡Membresía Creada Exitosamente!</h3>
                  </div>
                  
                  <div class="border border-green-200 rounded-lg p-4 mb-4">
                      <h4 class="font-medium text-green-700 mb-3">Información de la Membresía:</h4>
                      <div class="space-y-2 text-sm">
                          <p><strong>Titular:</strong> ${data.titular}</p>
                          <p><strong>Tipo de membresía:</strong> ${
                            data.tipo_membresia
                          }</p>
                          <p><strong>Fecha de inicio:</strong> ${
                            data.fecha_inicio
                          }</p>
                          <p><strong>Fecha de expiración:</strong> ${
                            data.fecha_fin
                          }</p>
                          <p><strong>Método de pago:</strong> ${
                            data.metodo_pago
                          }</p>
                          <p><strong>Total pagado:</strong> $${data.precio_final.toFixed(
                            2
                          )}</p>
                          <p><strong>Total en letras:</strong> ${precioEnLetras}</p>
                      </div>
                      ${integrantesHTML}
                  </div>

                  <div class="border border-green-200 rounded-lg p-4 mb-4">
                      <h4 class="font-medium text-green-700 mb-3 text-center">Código QR de Acceso:</h4>
                      <div class="flex justify-center mb-3">
                          <img id="qrImage" src="${
                            data.qr_path
                          }?t=${new Date().getTime()}" 
                              alt="QR de membresía ${data.titular}" 
                              class="w-48 h-48 border border-gray-300 rounded object-contain bg-white"
                              onerror="this.style.display='none'; document.getElementById('qrError').style.display='block';">
                      </div>
                      <div id="qrError" class="text-center text-yellow-600 mb-3" style="display: none;">
                          <i class="fas fa-exclamation-triangle"></i> El QR se está generando...
                      </div>
                      <div class="text-center">
                          <button onclick="MembershipUI.descargarQR(${
                            data.id_activa
                          })" 
                                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                              </svg>
                              Descargar QR
                          </button>
                      </div>
                  </div>

                  <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p class="text-sm text-green-700 text-center">
                          <strong>¡Importante!</strong> Se ha enviado un comprobante a su correo electrónico.
                          Presente este QR en recepción para acceder a las instalaciones.
                      </p>
                  </div>

                  <div class="flex justify-center space-x-3">
                      <button onclick="MembershipUI.cerrarModalExito()" 
                              class="px-6 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                          Cerrar
                      </button>
                      <button onclick="window.location.href='/memberships/listMembership'" 
                              class="px-6 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                          Ver Lista de Membresías
                      </button>
                  </div>
              </div>
          </div>
      `;

    // Agregar el modal al body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Intentar recargar la imagen después de un breve retraso
    setTimeout(() => {
      const qrImage = document.getElementById("qrImage");
      if (qrImage) {
        qrImage.src = qrImage.src.split("?")[0] + "?t=" + new Date().getTime();
      }
    }, 1000);
  },

  // Método para cerrar el modal de éxito
  cerrarModalExito: function () {
    const modal = document.getElementById("successModal");
    if (modal) {
      modal.remove();
    }
    // Opcionalmente limpiar el formulario
    this.limpiarFormularios();
  },

  // Método para descargar el QR
  descargarQR: function (id_activa) {
    const link = document.createElement("a");
    link.href = `/memberships/download-qr/${id_activa}`;
    link.download = `membresia_${id_activa}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Método para limpiar formularios
  limpiarFormularios: function () {
    if (this.formCliente) {
      this.formCliente.reset();
    }
    if (this.formMembership) {
      this.formMembership.reset();
      this.integrantesContainer.innerHTML = "";
      this.integrantesSection.classList.add("hidden");
    }

    this.clienteRegistrado = false;
    this.submitMembershipBtn.disabled = true;
    this.submitMembershipBtn.classList.remove(
      "bg-green-600",
      "hover:bg-green-700",
      "focus:ring-green-500"
    );
    this.submitMembershipBtn.classList.add(
      "bg-gray-400",
      "hover:bg-gray-400",
      "focus:ring-gray-400"
    );
    this.submitMembershipBtn.textContent =
      "Crear Membresía (complete primero el cliente)";
  },

  updateCalculatedDetails: async function () {
    const id_tipo_membresia = this.tipoMembresiaSelect.value;
    const fecha_inicio = this.fechaInicioInput.value;
    const descuento = this.descuentoInput ? parseInt(this.descuentoInput.value) || 0 : 0;

    if (!id_tipo_membresia || !fecha_inicio) {
      return; // No hacer nada si falta información
    }

    try {
      this.showMessage(this.membershipMessage, "Calculando...", "success");

      const resp = await fetch("/memberships/api/calculate-details", {
        method: "POST",
        body: JSON.stringify({ id_tipo_membresia, fecha_inicio, descuento }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Error del servidor");
      }

      this.precioFinalInput.value = data.precio_final;
      this.precioFinalHidden.value = data.precio_final;
      this.fechaFinInput.value = data.fecha_fin;
      this.membershipMessage.classList.add("hidden");

    } catch (err) {
      console.error("Error al calcular detalles:", err);
      this.showMessage(this.membershipMessage, `Error: ${err.message}`, "error");
    }
  },

  handleTipoMembresiaChange: function (e) {
    const selectedOption = e.target.options[e.target.selectedIndex];
    this.maxIntegrantes = parseInt(selectedOption.dataset.max, 10);

    this.updateCalculatedDetails(); // Llamada a la API

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

  agregarIntegrante: function () {
    const currentIntegrantes =
      this.integrantesContainer.querySelectorAll(".integrante").length;

    if (currentIntegrantes < this.maxIntegrantes - 1) {
      const integranteDiv = document.createElement("div");
      integranteDiv.classList.add(
        "integrante",
        "flex",
        "items-center",
        "space-x-2",
        "mb-2"
      );
      integranteDiv.innerHTML = `
              <input type="text" name="integrantes[]" placeholder="Nombre completo del integrante" required 
                  class="flex-1 px-3 py-2 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
              <button type="button" class="removeBtn px-3 py-2 border border-transparent rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  ❌ Eliminar
              </button>
          `;
      this.integrantesContainer.appendChild(integranteDiv);

      integranteDiv
        .querySelector(".removeBtn")
        .addEventListener("click", () => {
          integranteDiv.remove();
          const remaining =
            this.maxIntegrantes -
            1 -
            this.integrantesContainer.querySelectorAll(".integrante").length;
          if (remaining > 0) {
            this.showMessage(
              this.membershipMessage,
              `Puede agregar hasta ${remaining} integrantes más`,
              "success"
            );
            setTimeout(() => {
              this.membershipMessage.classList.add("hidden");
            }, 3000);
          }
        });
    } else {
      this.showMessage(
        this.membershipMessage,
        `Máximo ${this.maxIntegrantes - 1} integrantes adicionales permitidos`,
        "error"
      );
      setTimeout(() => {
        this.membershipMessage.classList.add("hidden");
      }, 3000);
    }
  },

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

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  MembershipUI.init();
});
