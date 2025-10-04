# Análisis Detallado de Violaciones del Patrón MVC en el Módulo de Membresías

## Introducción

Este documento detalla las áreas del código del módulo de membresías que no se adhieren estrictamente al patrón Arquitectónico Modelo-Vista-Controlador (MVC), según los criterios definidos. El análisis se ha centrado en la separación de responsabilidades:

*   **Modelos**: Encargados de la interacción con la base de datos.
*   **Vistas**: Encargadas de la presentación (HTML), con lógica mínima limitada a la visualización de datos.
*   **Controladores**: Encargados de recibir peticiones, orquestar la lógica de negocio llamando a los servicios y renderizar la vista adecuada.
*   **Servicios**: Encargados de contener toda la lógica de negocio.
*   **JavaScript (Cliente)**: Encargado de la interactividad del DOM, sin lógica de negocio crítica.

Se ha encontrado que, aunque existe una capa de servicios (`membershipService.js`) que demuestra la arquitectura deseada, su uso no es consistente en todo el módulo, llevando a violaciones significativas.

---

## 1. Violaciones en Controladores

Los controladores frecuentemente acceden a la capa de Modelo directamente y contienen lógica de negocio que debería estar encapsulada en la capa de Servicios.

### 1.1. `src/modules/membership/controllers/createMemberController.js`

*   **Problema**: Acceso directo al modelo para obtener datos.
*   **Explicación**: Varios métodos consultan `MembershipModel` directamente en lugar de delegar a `MembershipService`. El controlador no debería saber cómo se obtienen los datos.
*   **Ejemplos**:
    *   **Línea 100 (aprox) - `serveQRCode`**:
        ```javascript
        async serveQRCode(req, res) {
          try {
            const { id_activa } = req.params;
            const membresia = await MembershipModel.getMembresiaById(id_activa); // VIOLACIÓN
            // ...
          } // ...
        }
        ```
    *   **Línea 160 (aprox) - `renderTiposMembresia`**:
        ```javascript
        async renderTiposMembresia(req, res) {
          try {
            // ...
            const tiposMembresia = await MembershipModel.getTiposMembresia(); // VIOLACIÓN
            const tiposPago = await MembershipModel.getMetodosPago(); // VIOLACIÓN
            // ...
          } // ...
        }
        ```
*   **Solución Sugerida**: Crear métodos en `MembershipService` que obtengan estos datos (ej. `getMembershipQRInfo`, `getDataForCreateView`), y que los controladores llamen a estos métodos del servicio.

### 1.2. `src/modules/membership/controllers/deleteMemberController.js`

*   **Problema**: Acceso directo al modelo para realizar una operación de escritura.
*   **Explicación**: El controlador llama directamente a la función de eliminación del modelo, saltándose la capa de servicio.
*   **Ejemplo**:
    *   **Línea 7 (aprox) - `deleteMembership`**:
        ```javascript
        async deleteMembership(req, res) {
          try {
            const { id } = req.params;
            const result = await deleteMembershipById(id); // VIOLACIÓN
            // ...
          } // ...
        }
        ```
*   **Solución Sugerida**: Crear un método `deleteMembership` en `MembershipService` que se encargue de la lógica de borrado, y que el controlador simplemente lo llame.

### 1.3. `src/modules/membership/controllers/editMemberController.js`

*   **Problema**: Múltiples accesos directos al modelo para leer y escribir datos.
*   **Explicación**: Casi todas las funciones de este controlador interactúan directamente con el modelo.
*   **Ejemplos**:
    *   **Línea 8 (aprox) - `editMembership`**:
        ```javascript
        const membresia = await MembershipModel.getMembresiaById(id); // VIOLACIÓN
        ```
    *   **Línea 29 (aprox) - `updateMembership`**:
        ```javascript
        const membresia = await MembershipModel.getMembresiaById(id); // VIOLACIÓN
        // ...
        const result = await updateMembershipById(id, updateData); // VIOLACIÓN
        ```
*   **Solución Sugerida**: Centralizar toda esta lógica en `MembershipService` con métodos como `getMembershipForEdit` y `updateMembership`. El método `renewMembership` en este mismo archivo es un buen ejemplo de cómo debería hacerse, ya que sí utiliza el servicio.

### 1.4. `src/modules/membership/controllers/listMemberController.js`

*   **Problema**: Controlador "gordo" (fat controller) con acceso a modelo, lógica de negocio y generación de HTML.
*   **Explicación**: Este controlador es uno de los infractores más significativos.
    1.  **Acceso al Modelo**: Todas las funciones (`renderMembershipList`, `getMembresiasAPI`, etc.) llaman directamente a `modelList`.
    2.  **Lógica de Negocio**: La transformación de datos (calcular `estadoReal` basado en `dias_restantes`) está en el controlador. Esto es lógica de negocio que pertenece al servicio.
    3.  **Generación de HTML**: El bloque `catch` genera una página de error HTML completa como un string. El controlador solo debe renderizar una plantilla de vista.
*   **Ejemplos**:
    *   **Línea 33 (aprox) - Lógica de negocio**:
        ```javascript
        const membresiasFormateadas = membresias.map((membresia) => {
          const diasRestantes = membresia.dias_restantes;
          let estadoReal = "Activa";
          if (diasRestantes <= 0) { estadoReal = "Vencida"; } // VIOLACIÓN
          else if (diasRestantes <= 7) { estadoReal = "Por_Vencer"; } // VIOLACIÓN
          // ...
        });
        ```
    *   **Línea 75 (aprox) - Generación de HTML**:
        ```javascript
        res.status(500).send(`
          <!DOCTYPE html>
          <html>...</html> // VIOLACIÓN
        `);
        ```
*   **Solución Sugerida**: Mover toda la obtención y formateo de datos a un método en `MembershipService`. El controlador solo debería recibir la lista formateada y pasarla a la vista. El manejo de errores debe renderizar una vista de error (ej. `res.render('error', { message: ... })`).

### 1.5. `src/modules/membership/controllers/reportsController.js`

*   **Problema**: Contiene lógica de negocio compleja y lógica de nivel de servicio (generación de PDF).
*   **Explicación**:
    1.  **Lógica de Negocio**: Las funciones `getReportDateRange` y `validateReportParams` contienen reglas de negocio para interpretar fechas y validar parámetros. Esto debería estar en un servicio.
    2.  **Lógica de Servicio**: El método `downloadReportPDF` realiza una orquestación compleja (leer archivos, compilar plantillas, generar PDF con Puppeteer) que define el trabajo de un servicio (`PDFService` o `ReportService`), no de un controlador.
*   **Ejemplo**:
    *   **Línea 118 (aprox) - Lógica de generación de PDF**:
        ```javascript
        async downloadReportPDF(req, res) {
          // ...
          const templateFile = await fs.readFile(templatePath, "utf8"); // VIOLACIÓN
          const template = hbs.compile(templateFile); // VIOLACIÓN
          // ...
          const browser = await puppeteer.launch({...}); // VIOLACIÓN
          // ...
        }
        ```
*   **Solución Sugerida**: Crear un `ReportService` que contenga toda la lógica de validación, cálculo de rangos y generación de PDF. El controlador solo debería invocar `const pdf = await ReportService.generatePDF(...)` y enviarlo.

---

## 2. Violaciones en Vistas (Handlebars)

Las vistas contienen lógica de negocio, autorización y de presentación compleja que debería ser pre-procesada por el controlador o el servicio.

### 2.1. `src/modules/membership/views/membershipList.hbs`

*   **Problema**: Lógica de negocio y autorización en la plantilla.
*   **Explicación**:
    1.  **Lógica de Negocio**: Un bloque `if/else` anidado con un helper `gt` (greater than) se usa para determinar el estado de la membresía y su clase CSS. Esta decisión multi-condicional es lógica de negocio.
    2.  **Lógica de Autorización**: La plantilla decide si mostrar el botón de renovar con la condición `(or ../isAdmin (eq this.daysUntilExpiry 0))`. La autorización es responsabilidad del backend.
*   **Ejemplos**:
    *   **Línea 230 (aprox) - Lógica de estado**:
        ```hbs
        {{#if (gt this.daysUntilExpiry 7)}}
          <span class="status-badge bg-green-100 ...">Activa...</span>
        {{else}}
          {{#if (gt this.daysUntilExpiry 0)}}
            <span class="status-badge bg-amber-100 ...">Por vencer...</span>
          {{/if}}
        {{/if}}
        ```
    *   **Línea 260 (aprox) - Lógica de autorización**:
        ```hbs
        {{#if (or ../isAdmin (eq this.daysUntilExpiry 0))}}
            <a href="/memberships/renew/{{this.id}}"...>Renovar</a>
        {{/if}}
        ```
*   **Solución Sugerida**: El servicio debe calcular el estado exacto (ej. `{ status: 'Por Vencer', statusClass: 'bg-amber-100' }`) y una bandera booleana de autorización (ej. `{ canRenew: true }`). La vista solo debe renderizar estos valores: `<span class="{{this.statusClass}}">{{this.status}}</span>`.

### 2.2. `src/modules/membership/views/renewalMembership.hbs`

*   **Problema**: Lógica de negocio en un script incrustado.
*   **Explicación**: Un bloque `<script>` dentro del archivo `.hbs` contiene la lógica para calcular la fecha de vencimiento de una membresía basándose en su tipo (anual, mensual, etc.). Esta es una regla de negocio fundamental que está duplicada en el cliente.
*   **Ejemplo**:
    *   **Línea 118 (aprox) - Cálculo de fecha de fin**:
        ```javascript
        if (selectedTipo.nombre.toLowerCase().includes('anual')) {
            fechaInicio.setFullYear(fechaInicio.getFullYear() + 1);
        } else if (selectedTipo.nombre.toLowerCase().includes('mensual')) {
            fechaInicio.setMonth(fechaInicio.getMonth() + 1);
        }
        ```
*   **Solución Sugerida**: Eliminar esta lógica del cliente. La UI debería llamar a un endpoint de la API (como el que ya existe en `createMemberController`) para obtener la fecha de fin calculada por el servidor cada vez que el tipo de membresía o la fecha de inicio cambian.

### 2.3. `src/modules/membership/views/reports.hbs`

*   **Problema**: Generación de HTML y lógica de negocio en un script incrustado.
*   **Explicación**: El script de esta página obtiene datos de una API y construye el HTML de la tabla de vista previa como un string. La estructura de la vista no debe ser creada en JavaScript. Además, manipula los datos de fecha para ajustarlos al formato esperado por la API.
*   **Ejemplo**:
    *   **Línea 160 (aprox) - Generación de HTML**:
        ```javascript
        const previewHtml = `
            <h2 ...>Vista Previa del Reporte</h2>
            <table ...>
                // ... Filas generadas como string
            </table>
        `;
        previewContainer.innerHTML = previewHtml;
        ```
*   **Solución Sugerida**: El HTML de la tabla de vista previa debe existir en la plantilla `.hbs` (posiblemente como un parcial) y estar oculto. El JavaScript debe obtener los datos y simplemente poblar esta estructura existente, no crearla.

---

## 3. Violaciones en JavaScript del Lado del Cliente

Los archivos JavaScript de `public/js` a menudo contienen lógica de negocio y, de forma recurrente, generan HTML, acoplando la lógica del cliente con la estructura de la vista.

### 3.1. `public/js/moduleMembershipJs/createMembership.js`

*   **Problema**: Lógica de negocio y generación de HTML.
*   **Explicación**:
    1.  **Lógica de Negocio**: La función `convertirNumeroALetras` para escribir el precio en texto es lógica de negocio de formato de recibos que no debe estar en el cliente.
    2.  **Generación de HTML**: La función `mostrarModalExito` crea un modal complejo mediante un string de HTML.
*   **Ejemplo**:
    *   **Línea 310 (aprox) - Lógica de negocio**:
        ```javascript
        const convertirNumeroALetras = (numero) => { /* ... */ };
        ```
    *   **Línea 350 (aprox) - Generación de HTML**:
        ```javascript
        const modalHTML = `<div id="successModal" ...> ... </div>`;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        ```
*   **Solución Sugerida**: El servidor debe proveer el precio en letras. La estructura del modal debe estar en la plantilla `.hbs` como un parcial o un elemento oculto, y el JS solo debe mostrarlo y llenarlo de datos.

### 3.2. `public/js/moduleMembershipJs/listMembership.js`

*   **Problema**: Generación de HTML e ingeniería inversa de la lógica de negocio.
*   **Explicación**:
    1.  **Generación de HTML**: Las funciones `showIntegrantesModal` y `showDetailsModal` crean modales complejos como strings de HTML.
    2.  **Ingeniería Inversa**: La función `extractDays` lee el texto visible del "estado" (ej. "Por vencer (7 días)"), lo parsea con una expresión regular para obtener el número de días y poder ordenar la tabla. Esto es un anti-patrón muy frágil.
*   **Ejemplo**:
    *   **Línea 370 (aprox) - Ingeniería inversa**:
        ```javascript
        extractDays: function (text) {
          const match = text.match(/(\d+)\s*días/); // VIOLACIÓN
          if (match) return parseInt(match[1]);
          if (text.includes("Vencida")) return -1; // VIOLACIÓN
        }
        ```
*   **Solución Sugerida**: El backend debe pasar los datos brutos a la vista (ej. `daysUntilExpiry`). La vista debe almacenar este dato en un atributo `data-days-left="{{this.daysUntilExpiry}}"` en la fila de la tabla. El JavaScript debe leer este atributo `data-*` para ordenar, en lugar de parsear el texto de la UI.

### 3.3. `public/js/moduleMembershipJs/editMembership.js` y `deleteMembership.js`

*   **Problema**: Generación de HTML.
*   **Explicación**: Ambos archivos crean elementos de la interfaz (campos de formulario para integrantes, modales de éxito/error) mediante la construcción de strings de HTML en JavaScript.
*   **Ejemplo (`editMembership.js`)**:
    *   **Línea 23 (aprox)**:
        ```javascript
        const newIntegrante = `
          <div class="integrante-item ...">
            // ... inputs y botones como string
          </div>
        `;
        div.innerHTML = newIntegrante;
        ```
*   **Solución Sugerida**: Utilizar plantillas HTML (ej. la etiqueta `<template>`) en el archivo `.hbs` para definir la estructura de estos elementos. El JavaScript debe clonar estas plantillas para crear nuevos elementos dinámicamente.

---

## Conclusión General

El módulo de membresías tiene una base arquitectónica sólida visible en su capa de servicios. Sin embargo, esta arquitectura no se aplica de manera consistente. Las violaciones recurrentes son:

1.  **Controladores Gordos**: Asumen responsabilidades de los servicios.
2.  **Vistas Inteligentes**: Contienen lógica de negocio y autorización.
3.  **JavaScript que Genera Vistas**: Los scripts del cliente construyen HTML, casando la lógica con la presentación.

Corregir estos problemas centralizará la lógica de negocio en la capa de servicios, hará los controladores más delgados y fáciles de mantener, y desacoplará las vistas y los scripts del cliente, resultando en un sistema más robusto, mantenible y escalable.