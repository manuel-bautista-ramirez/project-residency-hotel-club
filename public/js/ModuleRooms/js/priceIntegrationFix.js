// Fix para integrar correctamente el cálculo de precios con las validaciones
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔗 Aplicando integración de cálculo de precios...");

  // Esperar a que todos los scripts se carguen
  setTimeout(() => {
    // Fix para reservaciones
    const reserveForm = document.getElementById('formReserve');
    if (reserveForm) {
      const priceField = document.getElementById('price');
      const priceTextField = document.getElementById('price_text');

      if (priceField && priceTextField) {
        // Asegurar que el campo de precio en letras se actualice cuando cambie el precio
        const updatePriceText = () => {
          const price = parseFloat(priceField.value) || 0;
          if (price > 0 && window.numberToWords) {
            priceTextField.value = window.numberToWords(price);
          } else if (price > 0 && window.numberToWordsGlobal) {
            priceTextField.value = window.numberToWordsGlobal(price);
          }
        };

        // Observar cambios en el campo de precio
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
              updatePriceText();
            }
          });
        });

        observer.observe(priceField, {
          attributes: true,
          attributeFilter: ['value']
        });

        // También observar cambios en el valor del input
        priceField.addEventListener('input', updatePriceText);
        priceField.addEventListener('change', updatePriceText);

        // Trigger inicial
        updatePriceText();

        console.log("🔗 Integración aplicada al formulario de reservaciones");
      }
    }

    // Fix para rentas
    const rentForm = document.getElementById('formRent');
    if (rentForm) {
      const priceField = document.getElementById('price');
      const priceTextField = document.getElementById('price_text');

      if (priceField && priceTextField) {
        // Asegurar que el campo de precio en letras se actualice cuando cambie el precio
        const updatePriceText = () => {
          const price = parseFloat(priceField.value) || 0;
          if (price > 0 && window.numberToWords) {
            priceTextField.value = window.numberToWords(price);
          } else if (price > 0 && window.numberToWordsGlobal) {
            priceTextField.value = window.numberToWordsGlobal(price);
          }
        };

        // Observar cambios en el campo de precio
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
              updatePriceText();
            }
          });
        });

        observer.observe(priceField, {
          attributes: true,
          attributeFilter: ['value']
        });

        // También observar cambios en el valor del input
        priceField.addEventListener('input', updatePriceText);
        priceField.addEventListener('change', updatePriceText);

        // Trigger inicial
        updatePriceText();

        console.log("🔗 Integración aplicada al formulario de rentas");
      }
    }

    // Asegurar que las funciones de cálculo de precios existentes funcionen
    if (window.fetchPrice && typeof window.fetchPrice === 'function') {
      console.log("✅ Función fetchPrice disponible");
    }

    if (window.numberToWords && typeof window.numberToWords === 'function') {
      console.log("✅ Función numberToWords disponible");
    }

    console.log("✅ Integración de cálculo de precios completada");
  }, 1000); // Esperar 1 segundo para que todos los scripts se carguen
});
