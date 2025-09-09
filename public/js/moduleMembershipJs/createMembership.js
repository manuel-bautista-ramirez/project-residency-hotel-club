// Funciones de utilidad
const MembershipUI = {
  init: function () {
    this.bindEvents();
    this.setMinDate();
    this.triggerInitialEvents();
  },

  bindEvents: function () {
    // Referencias a elementos del DOM
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

    // Manejar envío del formulario de cliente
    if (this.formCliente) {
      this.formCliente.addEventListener("submit", (e) => {
        e.preventDefault();
        this.mostrarModalCliente();
      });
    }

    // Confirmar creación de cliente
    if (this.confirmClienteBtn) {
      this.confirmClienteBtn.addEventListener("click", () => {
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
        if (!this.clienteRegistrado) {
          this.showMessage(
            this.membershipMessage,
            "Debe registrar un cliente primero",
            "error"
          );
          return;
        }
        this.mostrarModalMembresia();
      });
    }

    // Confirmar creación de membresía
    if (this.confirmMembershipBtn) {
      this.confirmMembershipBtn.addEventListener("click", () => {
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

    // Calcular fecha de fin
    if (this.fechaInicioInput) {
      this.fechaInicioInput.addEventListener("change", () => {
        this.calcularFechaFin();
      });
    }

    // Botón para agregar integrantes
    if (this.addIntegranteBtn) {
      this.addIntegranteBtn.addEventListener("click", () => {
        this.agregarIntegrante();
      });
    }

    // Aplicar descuento (solo para admin)
    if (this.aplicarDescuentoBtn) {
      this.aplicarDescuentoBtn.addEventListener("click", () => {
        this.aplicarDescuento();
      });
    }
  },

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
    this.clienteModal.classList.add("hidden");
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
    this.membershipModal.classList.add("hidden");
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
        return;
      }

      const fechaInicio = new Date(this.fechaInicioInput.value);
      if (fechaInicio < new Date().setHours(0, 0, 0, 0)) {
        this.showMessage(
          this.membershipMessage,
          "Error: La fecha de inicio no puede ser anterior a hoy",
          "error"
        );
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
          return;
        }

        for (let integrante of integrantes) {
          if (!integrante.value.trim()) {
            this.showMessage(
              this.membershipMessage,
              "Error: Todos los integrantes deben tener un nombre",
              "error"
            );
            return;
          }
        }
      }

      const formData = new FormData(this.formMembership);
      const resp = await fetch(this.formMembership.action, {
        method: "POST",
        body: new URLSearchParams(formData),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (resp.redirected) {
        window.location.href = resp.url;
        return;
      }

      const responseData = await resp.json();

      if (!resp.ok) {
        throw new Error(responseData.error || "Error HTTP " + resp.status);
      }

      if (responseData.success) {
        this.showMessage(
          this.membershipMessage,
          "Membresía creada con éxito. Redirigiendo...",
          "success"
        );
        setTimeout(() => {
          window.location.href = "/membership/membershipList";
        }, 2000);
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
    }
  },

  handleTipoMembresiaChange: function (e) {
    const selectedOption = e.target.options[e.target.selectedIndex];
    this.maxIntegrantes = parseInt(selectedOption.dataset.max, 10);
    this.precioBase = parseFloat(selectedOption.dataset.precio);

    this.aplicarPrecioConDescuento();

    if (this.fechaInicioInput.value) {
      this.calcularFechaFin();
    }

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

  calcularFechaFin: function () {
    if (!this.fechaInicioInput.value) return;

    const startDate = new Date(this.fechaInicioInput.value);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + this.duracionDias);

    const yyyy = endDate.getFullYear();
    const mm = String(endDate.getMonth() + 1).padStart(2, "0");
    const dd = String(endDate.getDate()).padStart(2, "0");

    this.fechaFinInput.value = `${yyyy}-${mm}-${dd}`;
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

  aplicarDescuento: function () {
    const descuento = parseInt(this.descuentoInput.value) || 0;
    if (descuento < 0 || descuento > 100) {
      this.showMessage(
        this.membershipMessage,
        "El descuento debe estar entre 0 y 100%",
        "error"
      );
      return;
    }

    this.descuentoAplicado = descuento;
    this.aplicarPrecioConDescuento();
    this.showMessage(
      this.membershipMessage,
      `Descuento del ${descuento}% aplicado correctamente`,
      "success"
    );
  },

  aplicarPrecioConDescuento: function () {
    if (this.precioBase) {
      const precioConDescuento =
        this.precioBase - this.precioBase * (this.descuentoAplicado / 100);
      this.precioFinalInput.value = `$${precioConDescuento.toFixed(2)}`;
      this.precioFinalHidden.value = precioConDescuento.toFixed(2);
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
