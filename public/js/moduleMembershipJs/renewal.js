/**
 * Se ejecuta cuando el contenido del DOM ha sido completamente cargado y parseado.
 * Es el punto de entrada para toda la lógica del script.
 */
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('renewMembershipForm');
  const tipoMembresiaSelect = document.getElementById('id_tipo_membresia');
  const fechaInicioInput = document.getElementById('fecha_inicio');
  const fechaFinInput = document.getElementById('fecha_fin');
  const precioFinalInput = document.getElementById('precio_final');
  const integrantesSection = document.getElementById('integrantesSection');
  const integrantesContainer = document.getElementById('integrantesContainer');
  let maxIntegrantes = 1;

  /**
   * Función asíncrona que se comunica con una API del backend para calcular
   * dinámicamente la fecha de fin de la membresía.
   * Se basa en el tipo de membresía y la fecha de inicio seleccionadas.
   */
  async function updateCalculatedDetails() {
    const id_tipo_membresia = tipoMembresiaSelect.value;
    const fecha_inicio = fechaInicioInput.value;
    const descuento = 0; // El descuento no aplica en renovación según el flujo actual

    // Solo proceder si tenemos los datos necesarios
    if (!id_tipo_membresia || !fecha_inicio) {
      return;
    }

    try {
      // Realiza una petición POST a la API. Se envía un objeto JSON con los datos necesarios.
      // El descuento se envía como 0 porque no es relevante para el cálculo de la fecha,
      // pero la API probablemente espera recibir ese campo.
      const resp = await fetch('/memberships/api/calculate-details', { // Reutilizamos la API existente
        method: 'POST',
        body: JSON.stringify({ id_tipo_membresia, fecha_inicio, descuento: 0 }), // El descuento no es relevante para la fecha
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await resp.json();

      // Si la respuesta del servidor no es exitosa (ej. status 400 o 500), lanza un error.
      if (!resp.ok) {
        throw new Error(data.error || 'Error del servidor al calcular la fecha de fin.');
      }

      // Si la petición fue exitosa, actualiza el valor del campo de fecha de fin en el formulario.
      if (fechaFinInput) fechaFinInput.value = data.fecha_fin;
      if (precioFinalInput) precioFinalInput.value = data.precio_final;

    } catch (err) {
      console.error('Error al calcular detalles de la membresía:', err);
      if (typeof window.showNotification === 'function') {
        window.showNotification('Error al calcular detalles: ' + err.message, 'error');
      }
    }
  }

  /**
   * Maneja el cambio en el tipo de membresía para mostrar u ocultar la sección de integrantes.
   */
  function handleTipoMembresiaChange() {
    const selectedOption = tipoMembresiaSelect.options[tipoMembresiaSelect.selectedIndex];
    const tipoNombre = selectedOption.text.toLowerCase();
    maxIntegrantes = parseInt(selectedOption.dataset.maxIntegrantes, 10) || 1;

    updateCalculatedDetails(); // Recalcular precio y fecha al cambiar tipo

    if (tipoNombre.includes('familiar') && integrantesSection) {
      integrantesSection.classList.remove('hidden');

      // Si no hay integrantes ya cargados (ej. cambiando de Individual a Familiar), añadir los campos por defecto.
      if (integrantesContainer.children.length === 0) {
        // El número de campos a mostrar se basa en el máximo permitido por el tipo de membresía.
        // Se resta 1 porque el titular ya cuenta como un integrante.
        const camposAAnadir = maxIntegrantes > 1 ? maxIntegrantes - 1 : 0;
        for (let i = 0; i < camposAAnadir; i++) {
          addIntegrante();
        }
      }

      // Re-indexar los integrantes existentes para asegurar que los nombres son correctos
      updateIntegrantesIndexes();
    } else {
      integrantesContainer.innerHTML = ""; // Limpiar integrantes si se cambia a un tipo no familiar
      integrantesSection.classList.add('hidden');
    }
  }

  /**
   * Añade un nuevo campo de integrante al formulario.
   */
  function addIntegrante() {
    const template = document.getElementById('integrante-template');
    if (!template) return;

    const clone = template.content.cloneNode(true);

    integrantesContainer.appendChild(clone);
    updateIntegrantesIndexes();
  }

  /**
   * Re-indexa los campos de integrantes para que el backend los reciba correctamente.
   */
  function updateIntegrantesIndexes() {
    integrantesContainer.querySelectorAll('.integrante-item').forEach((item, index) => {
      item.querySelectorAll('input, select').forEach(input => {
        if (input.name) {
          input.name = input.name.replace(/\[.*?\]/, `[${index}]`);
        }
      });
    });
  }

  /**
   * Vincula los eventos de filtrado de entrada en tiempo real a los campos del formulario.
   * Esto previene que el usuario ingrese caracteres no válidos.
   */
  function bindInputFiltering() {
    const filterInput = (inputElement, regex) => {
      if (!inputElement) return;
      inputElement.addEventListener('input', (e) => {
        const originalValue = e.target.value;
        const sanitizedValue = originalValue.replace(regex, '');
        if (originalValue !== sanitizedValue) {
          e.target.value = sanitizedValue;
        }
      });
    };

    const nombreCompletoInput = document.getElementById('nombre_completo');
    const telefonoInput = document.getElementById('telefono');

    // Filtrar nombre completo (solo letras, espacios y caracteres españoles)
    filterInput(nombreCompletoInput, /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g);

    // Filtrar teléfono (solo números, máximo 10)
    // y validar longitud al salir del campo.
    if (telefonoInput) {
      // Evento 'input': se ejecuta mientras el usuario escribe.
      telefonoInput.addEventListener('input', (e) => {
        const originalValue = e.target.value;
        let sanitizedValue = originalValue.replace(/[^0-9]/g, '');
        if (sanitizedValue.length > 10) {
          sanitizedValue = sanitizedValue.slice(0, 10);
        }
        if (originalValue !== sanitizedValue) {
          e.target.value = sanitizedValue;
        }
      });

      // Evento 'blur': se ejecuta cuando el usuario sale del campo.
      telefonoInput.addEventListener('blur', (e) => {
        const currentValue = e.target.value;
        // Si el campo no está vacío pero no tiene 10 dígitos, se limpia.
        if (currentValue.length > 0 && currentValue.length < 10) {
          e.target.value = ''; // Limpiar el campo.
        }
      });
    }

    // Delegación de eventos para los campos de integrantes creados dinámicamente
    if (integrantesContainer) {
      integrantesContainer.addEventListener('input', (e) => {
        // Validar si el campo es un nombre de integrante
        if (e.target && e.target.name && e.target.name.includes('[nombre_completo]')) {
          const originalValue = e.target.value;
          const sanitizedValue = originalValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
          if (originalValue !== sanitizedValue) {
            e.target.value = sanitizedValue;
          }
        }
      });
    }
  }

  // --- VINCULACIÓN DE EVENTOS ---

  if (form) {
    form.addEventListener('submit', function (e) {
      // Prevenir el envío si la validación falla
      if (!Validator.validateForm(form)) {
        e.preventDefault();
        console.log("Validación del formulario fallida.");
      }
    });
  }

  /**
   * Asigna la función `updateCalculatedDetails` como manejador del evento 'change'
   * para los campos de selección de membresía y fecha de inicio.
   * Esto hace que la fecha de fin se recalcule cada vez que el usuario modifica uno de estos campos.
   */
  if (tipoMembresiaSelect) {
    tipoMembresiaSelect.addEventListener('change', handleTipoMembresiaChange);
  }
  if (fechaInicioInput) {
    fechaInicioInput.addEventListener('change', updateCalculatedDetails);
  }

  /**
   * Llama a la función una vez al cargar la página para establecer el valor inicial
   * de la fecha de fin, basado en los valores por defecto del formulario.
   */
  function initializeForm() {
    handleTipoMembresiaChange(); // Esto también llama a updateCalculatedDetails
    bindInputFiltering(); // Añadir los listeners de validación en tiempo real
  }

  initializeForm();
});
