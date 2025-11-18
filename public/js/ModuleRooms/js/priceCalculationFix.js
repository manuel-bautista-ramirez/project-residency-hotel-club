// Fix para asegurar que el cálculo de precios funcione correctamente
document.addEventListener("DOMContentLoaded", () => {
  console.log("💰 Aplicando fix para cálculo de precios...");

  // Función para convertir números a palabras (mejorada)
  const numberToWordsImproved = (number) => {
    if (!number || isNaN(number)) return "cero pesos";
    
    const units = [
      "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
      "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", 
      "dieciocho", "diecinueve", "veinte"
    ];
    
    const tens = [
      "", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"
    ];
    
    const hundreds = [
      "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", 
      "seiscientos", "setecientos", "ochocientos", "novecientos"
    ];
    
    const num = Math.floor(number);
    
    if (num === 0) return "cero pesos";
    if (num <= 20) return units[num] + " pesos";
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      return tens[ten] + (unit > 0 ? " y " + units[unit] : "") + " pesos";
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      let result = (num === 100 ? "cien" : hundreds[hundred]);
      if (remainder > 0) {
        result += " " + numberToWordsImproved(remainder).replace(" pesos", "");
      }
      return result + " pesos";
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      let result = (thousand === 1 ? "mil" : numberToWordsImproved(thousand).replace(" pesos", "") + " mil");
      if (remainder > 0) {
        result += " " + numberToWordsImproved(remainder).replace(" pesos", "");
      }
      return result + " pesos";
    }
    
    return num.toLocaleString('es-MX') + " pesos";
  };

  // Función para actualizar precio en letras automáticamente
  const updatePriceText = (priceInput, priceTextInput) => {
    if (!priceInput || !priceTextInput) return;
    
    const price = parseFloat(priceInput.value) || 0;
    priceTextInput.value = numberToWordsImproved(price);
  };

  // Aplicar a formularios de reservaciones
  const reserveForm = document.getElementById('formReserve');
  if (reserveForm) {
    const priceField = document.getElementById('price');
    const priceTextField = document.getElementById('price_text');
    const engancheField = document.getElementById('enganche');
    const engancheTextField = document.getElementById('enganche_text');

    if (priceField && priceTextField) {
      // Observer para detectar cambios en el precio
      const observer = new MutationObserver(() => {
        updatePriceText(priceField, priceTextField);
      });
      
      observer.observe(priceField, { 
        attributes: true, 
        attributeFilter: ['value'],
        childList: false,
        subtree: false
      });

      // Event listeners adicionales
      priceField.addEventListener('input', () => updatePriceText(priceField, priceTextField));
      priceField.addEventListener('change', () => updatePriceText(priceField, priceTextField));
      
      // Trigger inicial si ya hay valor
      if (priceField.value) {
        updatePriceText(priceField, priceTextField);
      }
    }

    if (engancheField && engancheTextField) {
      engancheField.addEventListener('input', () => updatePriceText(engancheField, engancheTextField));
      engancheField.addEventListener('change', () => updatePriceText(engancheField, engancheTextField));
    }

    console.log("💰 Fix aplicado al formulario de reservaciones");
  }

  // Aplicar a formularios de rentas
  const rentForm = document.getElementById('formRent');
  if (rentForm) {
    const priceField = document.getElementById('price');
    const priceTextField = document.getElementById('price_text');

    if (priceField && priceTextField) {
      // Observer para detectar cambios en el precio
      const observer = new MutationObserver(() => {
        updatePriceText(priceField, priceTextField);
      });
      
      observer.observe(priceField, { 
        attributes: true, 
        attributeFilter: ['value'],
        childList: false,
        subtree: false
      });

      // Event listeners adicionales
      priceField.addEventListener('input', () => updatePriceText(priceField, priceTextField));
      priceField.addEventListener('change', () => updatePriceText(priceField, priceTextField));
      
      // Trigger inicial si ya hay valor
      if (priceField.value) {
        updatePriceText(priceField, priceTextField);
      }
    }

    console.log("💰 Fix aplicado al formulario de rentas");
  }

  // Aplicar a formularios de editar reservación
  const editForm = document.getElementById('formEditReservation');
  if (editForm) {
    const amountField = document.getElementById('amount');
    const amountTextField = document.getElementById('amount_text');

    if (amountField && amountTextField) {
      amountField.addEventListener('input', () => updatePriceText(amountField, amountTextField));
      amountField.addEventListener('change', () => updatePriceText(amountField, amountTextField));
      
      // Trigger inicial si ya hay valor
      if (amountField.value) {
        updatePriceText(amountField, amountTextField);
      }
    }

    console.log("💰 Fix aplicado al formulario de editar reservación");
  }

  // Función global para uso manual
  window.updatePriceInWords = (inputId, textId) => {
    const priceInput = document.getElementById(inputId);
    const textInput = document.getElementById(textId);
    updatePriceText(priceInput, textInput);
  };

  // Función global para convertir números a palabras
  window.numberToWordsGlobal = numberToWordsImproved;

  console.log("✅ Fix de cálculo de precios aplicado correctamente");
});
