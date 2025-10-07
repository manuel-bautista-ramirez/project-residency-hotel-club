# project-residency_hotel_club

<!-- Badge de estado del workflow (reemplaza OWNER/REPO por el repo real) -->
[![DB Health](https://github.com/OWNER/REPO/actions/workflows/db-health.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/db-health.yml)

Este proyecto incluye scripts automatizados para crear/actualizar la base de datos, validar la salud del esquema y sembrar catálogos/usuarios de forma segura.

## Quick Start BD

- `npm run db:setup` Configura/actualiza el esquema y catálogos base (no destruye).
- `npm run db:reseed` Reaplica INSERTs idempotentes de catálogos (no duplica).
- `npm run db:reset` DROP + CREATE + inserts (solo desarrollo).
- `npm run db:drop` Drop ultra-seguro (requiere variables de confirmación).
- `npm run db:health` Verificación de salud. En CI usar `HEALTH_STRICT=true`.
- `npm run db:fix-constraints` Fuerza InnoDB y crea FKs faltantes si fuese necesario.
- `npm run db:seed-users` Verifica/crea usuarios de prueba (por defecto solo verifica; para crear usar `SEED_USERS=true`).

Variables útiles (PowerShell):
```
$env:HEALTH_STRICT="true"        # Falla health en CI si hay problemas
$env:SEED_USERS="true"           # Permite crear usuarios en el seed
```

Catálogos y datos base incluidos:
- `habitaciones`: 10 habitaciones (INSERT IGNORE).
- `metodos_pago`: Efectivo, Tarjeta de crédito, Transferencia bancaria.
- `tipos_membresia`: 4 tipos base.
- `precios`: tarifas para los 12 meses (sencilla y suite).

Usuarios de prueba (seed controlado):
- Por defecto: `manuel/manuel123` (Administrador) y `daniela/daniela123` (Usuario).
- Personalizables vía env: `ADMIN_USER/ADMIN_PASS/ADMIN_ROLE` y `USER2_USER/USER2_PASS/USER2_ROLE`.

Crear usuarios (único comando):
```powershell tu terminal favorita que uses en tu equipo
$env:SEED_USERS="true"; npm run db:seed-users
```

Si prefieres crear la BD manualmente, puedes usar el siguiente extracto SQL:



```sql
 CREATE DATABASE IF NOT EXISTS hotel_club;

 USE hotel_club;
 CREATE TABLE
  users_hotel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE, -- Nombre de usuario único
    password VARCHAR(255) NOT NULL, -- Contraseña cifrada
    role ENUM ('Administrador', 'Usuario') NOT NULL -- Rol del usuario
  );

  CREATE TABLE
  password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- ID del usuario que solicita la recuperación
    token VARCHAR(255) NOT NULL UNIQUE, -- Token único para la recuperación
    expires_at DATETIME NOT NULL, -- Fecha y hora de expiración del token
    FOREIGN KEY (user_id) REFERENCES users_hotel (id) ON DELETE CASCADE
  );
```

La base de datos está definida en `src/dataBase/database.db`. Recomendamos usar los comandos de Quick Start BD anteriores.

# Instrucciones para correr el proyecto

- comandos instalar las dependencias..
- Ejecutar los comandos en la terminal para instalar las dependencias del proyecto en el directorio raìz del proyecto:
```bash
    npm install : Para instalar todas las dependencias del proyecto.
    npm run dev : Para correr el entorno de desarrollo del servidor.
    npm run build :Para compilar los estilos de TailwindCSS.
```
- Asegúrate de que la base de datos MySQL esté corriendo y que las credenciales de conexión estén correctamente configuradas en el archivo `.env`. También puedes configurar conexión vía variables de entorno (ver `src/config/configuration.js`).

# Instrucciones para correr los dos servicios al mismo tiempo
- Para correr el servidor y el compilador de TailwindCSS al mismo tiempo, abrir 2 terminales y ejecutar los siguientes comandos en cada uno:

Terminal 1:
```bash
    npm run dev
```
Terminal 2:
```bash
    npm run build
```

# Nota: Asegurarse de que el servidor de MySQL esté corriendo.

# Crea el archivo 📂`.env`, agrega las variables para la conexión DB `.env`.

Notas adicionales:
- Si no creas/configuras la base de datos, el proyecto no podrá iniciar. Usa los scripts de BD provistos arriba.
- Los catálogos principales (por ejemplo, `metodos_pago`, `tipos_membresia`, `habitaciones`) se insertan con `db:setup`/`db:reseed` de forma idempotente.
- Ejecuta `npm run db:health` para verificar que la BD esté íntegra (tablas, índices, FKs, engine/collation). En CI puedes usar `HEALTH_STRICT=true`.
