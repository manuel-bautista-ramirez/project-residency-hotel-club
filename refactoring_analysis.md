# Análisis de Refactorización MVC - Módulo de Membresías

## 1. Introducción

Este documento detalla las áreas del código en el módulo de membresías que no se adhieren estrictamente al patrón de diseño Modelo-Vista-Controlador (MVC). El objetivo es identificar oportunidades de refactorización para mejorar la mantenibilidad, claridad y seguridad del código.

El análisis exhaustivo ha cubierto todos los controladores y archivos JavaScript del lado del cliente asociados con las funcionalidades de crear, leer, actualizar, eliminar y reportar membresías.

---

## 2. Resumen de Hallazgos

Se ha identificado un patrón consistente de violaciones del patrón MVC a lo largo de todo el módulo. Estas se pueden agrupar en tres categorías principales:

1.  **Controladores con Exceso de Responsabilidades ("Fat Controllers"):** Los controladores contienen lógica de negocio, acceso directo a la base de datos, y en algunos casos, lógica de presentación (generación de HTML/PDF), omitiendo casi por completo la capa de servicio.
2.  **Lógica de Negocio en el Enrutador:** El archivo de rutas contiene lógica que debería estar en un controlador.
3.  **Lógica de Negocio Crítica en el Cliente (Frontend):** Los archivos JavaScript del lado del cliente contienen reglas de negocio sensibles (cálculos de precios, fechas, filtrado de datos) que deberían ejecutarse exclusivamente en el servidor, presentando un riesgo de seguridad y problemas de escalabilidad.

---

## 3. Detalles de las Violaciones

### Violación 1: Lógica de Negocio y Complejidad en los Controladores (Patrón General)

A lo largo de todo el módulo, se observa un patrón consistente donde los controladores asumen responsabilidades que pertenecen a otras capas, principalmente a la capa de **Servicio** y, en algunos casos, a la capa de **Vista**.

-   **Archivos Afectados:**
    -   `createMemberController.js`
    -   `editMemberController.js`
    -   `listMemberController.js`
    -   `deleteMemberController.js`
    -   `reportsController.js`

#### Sub-violación 1.1: Controladores "Gordos" (Fat Controllers)

Los controladores contienen lógica de orquestación de negocio compleja en lugar de delegarla a un servicio.

-   **Ejemplo Crítico (`createMemberController.js` - `createMembership`):** Orquesta un flujo de 10 pasos para crear una membresía.
-   **Ejemplo Crítico (`editMemberController.js` - `renewMembership`):** Orquesta un flujo de 5 pasos para renovar una membresía.
-   **Ejemplo Crítico (`reportsController.js` - `downloadReportPDF`):** Orquesta un flujo complejo que incluye validación, obtención de datos, compilación de plantillas HTML, carga de CSS y generación de un archivo PDF.

-   **Código Problemático (`editMemberController.js`):**
    ```javascript
    async renewMembership(req, res) {
      try {
        // ...
        // 1. Actualizar datos del cliente (Acceso directo al modelo)
        await MembershipModel.updateClient({ ... });
        // 2. Desactivar la membresía antigua (Acceso directo al modelo)
        await MembershipModel.updateEstadoMembresia(id, 'Vencida');
        // 3. Crear el nuevo contrato (Acceso directo al modelo)
        const id_membresia = await MembershipModel.createMembershipContract({ ... });
        // 4. Activar la nueva membresía (Acceso directo al modelo)
        const id_activa_nueva = await MembershipModel.activateMembership({ ... });
        // 5. Registrar el pago (Acceso directo al modelo)
        await MembershipModel.recordPayment({ ... });
        // ...
      } catch (error) { /* ... */ }
    }
    ```
-   **Impacto:**
    -   **Acoplamiento Fuerte:** Los controladores están fuertemente acoplados a la implementación del modelo de datos.
    -   **Baja Cohesión y Alta Complejidad:** El código es difícil de leer, mantener y probar.
    -   **Difícil de Reutilizar:** La lógica no se puede reutilizar en otros contextos (ej. una tarea programada, una API) porque está atada a una petición HTTP.
-   **Recomendación General:**
    -   Crear métodos en la capa de servicio (`MembershipService`) que encapsulen estos flujos de negocio (ej. `createCompleteMembership`, `renewExistingMembership`, `generateMembershipReport`).
    -   El controlador debe limitarse a: 1. Extraer datos de `req`, 2. Llamar a **un único método** del servicio, 3. Enviar la respuesta.

#### Sub-violación 1.2: Acceso Directo a la Capa de Modelo

Todos los controladores interactúan directamente con los modelos (`MembershipModel`, `modelList`, etc.) para operaciones CRUD. La capa de servicio se omite por completo.

-   **Ejemplo (`deleteMemberController.js`):**
    ```javascript
    // src/modules/membership/controllers/deleteMemberController.js
    import { deleteMembershipById } from "../models/modelDelete.js";

    export const deleteMemberController = {
      async deleteMembership(req, res) {
        // ...
        const result = await deleteMembershipById(id); // Llamada directa al modelo
        // ...
      }
    };
    ```
-   **Impacto:** Viola la arquitectura de capas, haciendo que el sistema sea más rígido y difícil de modificar.
-   **Recomendación:** Todas las llamadas a los modelos deben realizarse exclusivamente desde la capa de servicio. El controlador solo debe hablar con el servicio.

#### Sub-violación 1.3: Lógica de Negocio y Formateo de Datos

-   **Archivo:** `listMemberController.js`
-   **Descripción:** El controlador contiene lógica para decidir qué datos obtener y cómo transformarlos para la vista. Esto incluye calcular el estado de una membresía ("Activa", "Vencida", "Por_Vencer") basándose en los días restantes.
-   **Código Problemático (`listMemberController.js`):**
    ```javascript
    // ...
    const diasRestantes = membresia.dias_restantes;
    let estadoReal = "Activa";
    if (diasRestantes <= 0) {
      estadoReal = "Vencida";
    } else if (diasRestantes <= 7) {
      estadoReal = "Por_Vencer";
    }
    // ...
    ```
-   **Impacto:** La lógica de negocio se filtra en la capa de presentación. El código está duplicado en `renderMembershipList` y `getMembresiasAPI`.
-   **Recomendación:** Mover la lógica de filtrado y la transformación de datos a la capa de servicio. El controlador debe recibir los datos ya procesados y listos para la vista.

#### Sub-violación 1.4: Generación de HTML en el Controlador

-   **Archivo:** `listMemberController.js`
-   **Descripción:** El bloque `catch` genera una página HTML de error completa como una cadena de texto.
-   **Impacto:** Violación grave de la separación de responsabilidades. El controlador no debe generar HTML.
-   **Recomendación:** Utilizar una vista dedicada para los errores: `res.render('errorView', { message: '...' });`.

### Violación 2: Lógica de Negocio en el Enrutador

-   **Archivo:** `src/modules/membership/routes/membership.Routes.js`
-   **Descripción:** La ruta `GET /api/qr/:id_activa` contiene lógica para buscar en la base de datos y verificar la existencia de un archivo.
-   **Código Problemático:**
    ```javascript
    // src/modules/membership/routes/membership.Routes.js
    routerMembership.get('/api/qr/:id_activa', async (req, res) => {
      try {
        const { id_activa } = req.params;
        const membresia = await MembershipModel.getMembresiaById(id_activa); // Acceso al modelo
        if (!fs.existsSync(membresia.qr_path)) { /* ... */ } // Lógica de archivos
        res.sendFile(path.resolve(membresia.qr_path));
      } catch (error) { /* ... */ }
    });
    ```
-   **Impacto:** Rompe la separación de responsabilidades. El enrutador solo debe mapear rutas a controladores.
-   **Recomendación:** Mover esta lógica a un método en un controlador apropiado y que la ruta simplemente lo llame.

### Violación 3: Lógica de Negocio Crítica en el Cliente (Frontend)

Se ha encontrado un patrón generalizado de colocar lógica de negocio sensible en los archivos JavaScript del lado del cliente.

-   **Archivos Afectados:**
    -   `public/js/moduleMembershipJs/createMembership.js`
    -   `public/js/moduleMembershipJs/listMembership.js`

#### Sub-violación 3.1: Cálculos de Negocio Inseguros

-   **Descripción:** El cliente calcula precios, descuentos y fechas de vencimiento.
-   **Código Problemático (`createMembership.js`):**
    ```javascript
    // Cálculo de precios
    const precioConDescuento = this.precioBase - this.precioBase * (this.descuentoAplicado / 100);
    // Cálculo de fecha de fin
    endDate.setDate(startDate.getDate() + this.duracionDias);
    ```
-   **Impacto:** **Grave vulnerabilidad de seguridad.** Un usuario puede manipular estos valores para obtener membresías a precios incorrectos o con duraciones extendidas.
-   **Recomendación:** El servidor debe ser la única fuente de verdad. El cliente debe enviar los datos básicos (ID del tipo de membresía, descuento si aplica) y el backend debe realizar todos los cálculos.

#### Sub-violación 3.2: Filtrado y Ordenación en el Cliente

-   **Descripción:** Toda la lógica para filtrar y ordenar la lista de membresías se ejecuta en el navegador.
-   **Código Problemático (`listMembership.js`):**
    ```javascript
    filterMemberships: function () { /* ... */ },
    sortTable: function (criteria) { /* ... */ }
    ```
-   **Impacto:**
    -   **No escalable:** Es inviable para una gran cantidad de datos.
    -   **Incompleto:** La búsqueda solo funciona sobre los datos visibles, no sobre el conjunto de datos completo en la base de datos.
-   **Recomendación:** La lógica de filtrado, búsqueda y ordenación debe realizarse en el backend a través de parámetros en la API (ej. `/api/memberships?search=...&sort=...`).

#### Sub-violación 3.3: Generación de HTML en JavaScript ("HTML en JS")

-   **Descripción:** Múltiples archivos JS construyen bloques de HTML como cadenas de texto.
-   **Archivos:** `createMembership.js`, `listMembership.js`, `editMembership.js`, `deleteMembership.js`.
-   **Impacto:** Dificulta el mantenimiento y la lectura. Mezcla la estructura (HTML) con el comportamiento (JS).
-   **Recomendación:** Usar plantillas HTML (`<template>`) o mantener las estructuras de los modales en el HTML principal (ocultas) y usar JS solo para mostrar/ocultar y rellenar los datos.