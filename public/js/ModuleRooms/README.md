# Validaciones del Módulo de Habitaciones

Este directorio contiene todas las validaciones del lado del cliente para el módulo de habitaciones del Hotel Club.

## 📁 Estructura de Archivos

```
/public/js/ModuleRooms/
├── js/
│   ├── index.js                      # Utilidades comunes y auto-inicialización
│   ├── reserveValidation.js          # Validaciones para formulario de reservaciones
│   ├── rentValidation.js             # Validaciones para formulario de rentas
│   ├── editReservationValidation.js  # Validaciones para editar reservaciones
│   ├── pricesValidation.js           # Validaciones para gestión de precios
│   └── reportsValidation.js          # Validaciones para generación de reportes
└── README.md                         # Este archivo
```

## 🚀 Funcionalidades Implementadas

### ✅ **Validaciones Generales**
- Validación en tiempo real mientras el usuario escribe
- Feedback visual con colores de borde (rojo/verde)
- Mensajes de error específicos y contextuales
- Scroll automático al primer error
- Prevención de caracteres inválidos

### 📋 **Por Formulario**

#### **1. Reservaciones (`reserveValidation.js`)**
- ✅ Nombre del cliente (solo letras y espacios, 2-50 caracteres)
- ✅ Email válido
- ✅ Teléfono (exactamente 10 dígitos)
- ✅ Fechas de ingreso/salida (no pasadas, salida > ingreso)
- ✅ Enganche (número positivo opcional)

#### **2. Rentas (`rentValidation.js`)**
- ✅ Nombre del cliente
- ✅ Email y teléfono
- ✅ Check-in/Check-out con fecha y hora
- ✅ Tipo de pago (efectivo/tarjeta/transferencia)
- ✅ Precio (número positivo)
- ✅ Conversión automática de números a texto

#### **3. Editar Reservación (`editReservationValidation.js`)**
- ✅ Todos los campos de reservación
- ✅ Verificación de disponibilidad de habitación
- ✅ Validación de monto y monto en letras
- ✅ Integración con API de disponibilidad

#### **4. Precios (`pricesValidation.js`)**
- ✅ Validación de números positivos
- ✅ Detección y resaltado de cambios
- ✅ Actualización masiva de precios
- ✅ Integración con API de precios

#### **5. Reportes (`reportsValidation.js`)**
- ✅ Tipo de reporte válido
- ✅ Rango de fechas (no futuras, máximo 1 año)
- ✅ Filtros opcionales (habitación, cliente, tipo de pago)
- ✅ Generación y envío de reportes

## 🛠️ Integración en las Vistas

Las validaciones ya están integradas en todas las vistas del módulo:

```html
<!-- En cada vista .hbs -->
<script src="/js/ModuleRooms/js/index.js"></script>
<script src="/js/ModuleRooms/js/[VALIDATION_FILE].js"></script>
```

### **Archivos Integrados:**
- ✅ `reserve.hbs` → `reserveValidation.js`
- ✅ `rent.hbs` → `rentValidation.js`
- ✅ `editReservation.hbs` → `editReservationValidation.js`
- ✅ `prices.hbs` → `pricesValidation.js`
- ✅ `reports.hbs` → `reportsValidation.js`

## 📖 Uso Programático

### **Acceso Global**
Todas las validaciones están disponibles globalmente:

```javascript
// Validaciones específicas
window.ReserveValidation.validation()
window.RentValidation.validation()
window.EditReservationValidation.validation()
window.PricesValidation.validation()
window.ReportsValidation.validation()

// Utilidades comunes
window.ValidationUtils.showNotification("Mensaje", "success")
window.ValidationUtils.clearErrors()
window.ValidationUtils.numberToText(1500)
```

### **Ejemplo de Uso Manual**
```javascript
// Validar formulario manualmente
const isValid = window.ReserveValidation.validation();
if (isValid) {
    console.log("Formulario válido");
    // Proceder con el envío
} else {
    console.log("Formulario inválido");
    // Los errores ya se muestran automáticamente
}
```

## 🎨 Estilos CSS Recomendados

Agregar estos estilos para mejorar la experiencia visual:

```css
.error-animation {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.modified-price {
  background-color: #f0f9ff !important;
  border-color: #3b82f6 !important;
}

.error-message {
  margin-top: 4px;
  font-size: 12px;
}
```

## 🔧 Personalización

### **Agregar Nueva Validación**
```javascript
// En cualquier archivo de validación
const fields = {
  nuevo_campo: {
    element: $("#nuevo_campo"),
    regEx: /^[a-zA-Z]+$/,
    message: "Solo se permiten letras",
  }
};
```

### **Modificar Mensajes**
```javascript
// En index.js
ValidationUtils.messages.email = "Tu mensaje personalizado";
```

### **Agregar Validación en Tiempo Real**
```javascript
const input = $("#mi_input");
if (input) {
  input.addEventListener("input", () => {
    // Tu lógica de validación
  });
}
```

## 🐛 Solución de Problemas

### **Las validaciones no se ejecutan**
1. Verificar que los scripts estén incluidos en la vista
2. Verificar que los IDs de los elementos coincidan
3. Revisar la consola del navegador para errores

### **Mensajes de error no aparecen**
1. Verificar que los elementos existan en el DOM
2. Verificar que no haya conflictos de CSS
3. Asegurar que `clearErrors()` no se ejecute inmediatamente después

### **Validaciones en tiempo real no funcionan**
1. Verificar que los elementos tengan los IDs correctos
2. Asegurar que el DOM esté completamente cargado
3. Revisar conflictos con otros event listeners

## 📝 Notas Importantes

- ✅ **Auto-inicialización**: Las validaciones se inicializan automáticamente
- ✅ **Compatibilidad**: Funciona con el JavaScript existente en las vistas
- ✅ **Reutilizable**: Utilidades comunes compartidas entre todos los formularios
- ✅ **Extensible**: Fácil agregar nuevas validaciones o modificar existentes
- ✅ **Responsive**: Funciona en dispositivos móviles y desktop

## 🎯 Estado del Proyecto

**✅ COMPLETADO** - Todas las validaciones están implementadas e integradas en las vistas correspondientes.

---

*Desarrollado para el proyecto Hotel Club - Sistema de validaciones del lado del cliente*
