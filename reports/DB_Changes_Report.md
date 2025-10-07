# Proyecto: Residency Hotel Club

## Reporte de Cambios y Validaciones de Base de Datos
Fecha: 2025-10-07
Autor: Manuel Ramírez
Equipo/Área: Los indestrcutibles


---

## 1. Resumen Ejecutivo
- Se normalizó el esquema de BD para MySQL y MariaDB (InnoDB + utf8mb4).
- Se incorporaron verificaciones automáticas de salud del esquema (tablas, índices, FKs, columnas, engine/collation) con reporte JSON.
- Se añadieron scripts npm para setup/reset/reseed/drop/health y fix de constraints.
- Se agregó módulo de recuperación de contraseñas (`password_resets`) con índices.
- Se preparó un seed controlado para creación de usuarios de prueba.

---

## 2. Cambios Clave por Archivo

- `src/dataBase/database.db`
  - Declaración explícita de `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` en todas las tablas.
  - Módulo Habitaciones completo: `habitaciones`, `precios`, `medios_mensajes`, `reservaciones`, `rentas`.
  - Inserciones idempotentes:
    - Habitaciones: 10 registros base.
    - Precios: 24 registros (12 meses x 2 tipos).
    - Métodos de pago: Efectivo, Tarjeta de crédito, Transferencia bancaria.
    - Tipos de membresía: 4 tipos base.
  - Módulo Membresías: `clientes`, `integrantes_membresia`, `membresias`, `membresias_activas`, `metodos_pago`, `pagos`, `tipos_membresia`.
  - `users_hotel`: tabla de usuarios (administración).
  - `password_resets`: nueva tabla con FK a `users_hotel(id)`, índices `idx_password_resets_user` y `idx_password_resets_expires`.
  - `pdf_registry`: tabla para registro de PDFs generados.

- `src/dataBase/setup.js`
  - Ejecución robusta del script SQL (tolerante e idempotente).
  - Verificación post-instalación:
    - Tablas requeridas (incluye `password_resets`).
    - Conteos rápidos: `metodos_pago`, `tipos_membresia`, `habitaciones`.
    - Índices clave y llaves foráneas.
    - Validación de columnas, engine y collation.
    - Generación de `db_health_report.json`.

- `src/dataBase/health.js`
  - Verificación aislada (sin modificar datos) de todo el esquema.
  - Modo estricto (`HEALTH_STRICT=true`) para CI/CD.
  - Incluye `password_resets` en las tablas requeridas.

- `src/dataBase/fix_constraints.js`
  - Asegura `ENGINE=InnoDB` en tablas que lo requieran y crea FKs faltantes en `reservaciones` y `rentas` si es necesario (idempotente).

- `src/modules/login/scripts/seedUsers.js`
  - Seed de usuarios en modo verificación por defecto (no crea).
  - Crea usuarios solo si `SEED_USERS=true` (contraseñas cifradas con bcrypt vía `addUser()`).
  - Variables de entorno para personalizar credenciales.

- `README.md`
  - Quick Start BD con todos los comandos.
  - Instrucciones claras para crear usuarios.
  - Notas de compatibilidad y uso.

- `.github/workflows/db-health.yml`
  - Workflow de GitHub Actions para validar el esquema en pull requests y pushes.

---

## 3. Comandos Disponibles
- `npm run db:setup` — Configura/actualiza esquema y catálogos (no destruye).
- `npm run db:reseed` — Reaplica INSERTs idempotentes.
- `npm run db:reset` — DROP + CREATE + inserts (desarrollo).
- `npm run db:drop` — Drop ultra-seguro (requiere variables de confirmación).
- `npm run db:health` — Health check (usar `HEALTH_STRICT=true` para modo estricto).
- `npm run db:fix-constraints` — Fuerza InnoDB y añade FKs faltantes.
- `npm run db:seed-users` — Verifica/crea usuarios (crea solo si `SEED_USERS=true`).

Variables útiles (PowerShell):
```powershell
$env:HEALTH_STRICT="true"    # Falla health si hay problemas críticos
$env:SEED_USERS="true"       # Permite crear usuarios en el seed
```

---

## 4. Resultados del Health Check
- Tablas requeridas: 15/15 presentes (`users_hotel`, `password_resets`, `habitaciones`, `precios`, `medios_mensajes`, `reservaciones`, `rentas`, `pdf_registry`, `clientes`, `integrantes_membresia`, `membresias`, `membresias_activas`, `metodos_pago`, `pagos`, `tipos_membresia`).
- Índices clave: `UNIQUE(nombre)` en `tipos_membresia`, `UNIQUE(username)` en `users_hotel` OK.
- Llaves foráneas en `reservaciones` y `rentas` OK.
- Columnas esperadas: OK en tablas clave.
- Engines/Collations: InnoDB + `utf8mb4` (MySQL 8 reporta `utf8mb4_0900_ai_ci`, compatible; para MariaDB se dejó `utf8mb4_unicode_ci` en el SQL).
- Reporte JSON: `src/dataBase/db_health_report.json`.

---

## 5. Compatibilidad MySQL/MariaDB
- Collation del SQL unificada a `utf8mb4_unicode_ci` para máxima compatibilidad.
- InnoDB declarado explícitamente.
- Notas:
  - MySQL 8: usa `utf8mb4_0900_ai_ci` internamente; compatible con el SQL.
  - MariaDB 10.6/10.11: soportado por `utf8mb4_unicode_ci`.

---

## 6. Seguridad y Salvaguardas
- `db:drop` requiere variables de confirmación para evitar borrados accidentales.
- `db:seed-users` no crea por defecto; requiere `SEED_USERS=true`.
- Contraseñas cifradas mediante bcrypt (`addUser()` en `userModel.js`).

---

## 7. Ejecución Recomendada
1) Desarrollo (instalación desde cero):
```powershell
npm run db:reset
npm run db:reseed
$env:HEALTH_STRICT="true"; npm run db:health
```
2) Producción (no destructivo):
```powershell
npm run db:setup
npm run db:health
```
3) Crear usuarios (si se requiere acceso de prueba):
```powershell
$env:SEED_USERS="true"; npm run db:seed-users
```

---

## 8. Anexos
- Ruta del SQL: `src/dataBase/database.db`
- Scripts DB: `src/dataBase/setup.js`, `src/dataBase/reseed.js`, `src/dataBase/drop.js`, `src/dataBase/health.js`, `src/dataBase/fix_constraints.js`
- Seed de usuarios: `src/modules/login/scripts/seedUsers.js`
- Workflow CI: `.github/workflows/db-health.yml`

### 8.1. Resumen del último Health
- Archivo: `src/dataBase/db_health_report.json`
- Cómo adjuntarlo:
  - Opción 1: Copiar el contenido relevante (secciones `requiredTables`, `engines`, `indexes`) en este PDF como anexos.
  - Opción 2: Adjuntar el archivo JSON como anexo separado en la entrega.

### 8.2. Exportar a PDF/DOCX
- VS Code (extensión recomendada: “Markdown PDF”): abrir `reports/DB_Changes_Report.md` y exportar a PDF o DOCX.
- Línea de comandos (Pandoc):
  ```bash
  pandoc reports/DB_Changes_Report.md -o reports/DB_Changes_Report.pdf
  pandoc reports/DB_Changes_Report.md -o reports/DB_Changes_Report.docx
  ```

---

Este documento puede exportarse a PDF o DOCX desde tu editor (VS Code u otro) o usando una herramienta de conversión Markdown a PDF/DOCX.
