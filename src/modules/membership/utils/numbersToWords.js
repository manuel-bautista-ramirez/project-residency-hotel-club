// utils/numberToWords.js
export function numeroALetras(numero) {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
    if (numero === 0) return 'cero pesos';
    if (numero === 1) return 'un peso';
    
    let resultado = '';
    
    // Manejar miles
    if (numero >= 1000) {
      const miles = Math.floor(numero / 1000);
      const resto = numero % 1000;
      
      if (miles === 1) {
        resultado = 'mil';
      } else {
        resultado = convertirCentenas(miles) + ' mil';
      }
      
      if (resto > 0) {
        resultado += ' ' + convertirCentenas(resto);
      }
    } else {
      resultado = convertirCentenas(numero);
    }
    
    return resultado + ' pesos';
  }
  
  function convertirCentenas(numero) {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
    if (numero === 0) return '';
    if (numero === 100) return 'cien';
    
    let resultado = '';
    
    // Centenas
    if (numero >= 100) {
      const cen = Math.floor(numero / 100);
      resultado = centenas[cen];
      numero = numero % 100;
    }
    
    // Decenas y unidades
    if (numero >= 20) {
      const dec = Math.floor(numero / 10);
      const uni = numero % 10;
      
      if (resultado) resultado += ' ';
      resultado += decenas[dec];
      
      if (uni > 0) {
        resultado += ' y ' + unidades[uni];
      }
    } else if (numero >= 10) {
      if (resultado) resultado += ' ';
      resultado += especiales[numero - 10];
    } else if (numero > 0) {
      if (resultado) resultado += ' ';
      resultado += unidades[numero];
    }
    
    return resultado;
  }