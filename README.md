# Project Residency Hotel Club

Sistema de gestión para hotel club con funcionalidades de reta de Habitaciones, Reservaciones de Habitaciones, Membresías Familiares, Membrecias Entradas Diarias Areas Deportivas; Canchas, Albercas y Gimnasio y administración.

## Requisitos Previos

- **Node.js** (versión recomendada: 14 o superior)
- **MySQL** (servidor de base de datos)
- **npm** (gestor de paquetes de Node.js)

## Configuración Inicial

### 1. Instalación de Dependencias

Ejecuta los siguientes comandos en el directorio raíz del proyecto:

**Paso 1: Instalar dependencias de Node.js**
```bash
npm install
```

**Paso 2: Instalar Chrome para Puppeteer (requerido para generar PDFs)**
```bash
npx puppeteer browsers install chrome
```

Este paso es **obligatorio** para que el sistema pueda generar comprobantes en PDF.

### 2. Configuración de la Base de Datos

#### Opción A: Crear la Base de Datos desde Cero

Si es la primera vez que configuras el proyecto o deseas reiniciar la base de datos:

**Paso 1: Acceder a MySQL**
```bash
mysql -u root -p
```

**Paso 2: Eliminar la base de datos existente (si existe)**
```sql
DROP DATABASE IF EXISTS hotel_club;
```

**Paso 3: Salir de MySQL**
```sql
EXIT;
```

**Paso 4: Ejecutar el script de creación**
```bash
mysql -u root -p < src/dataBase/database.sql
```

Este script creará:
- ✅ La base de datos `hotel_club`
- ✅ Todas las tablas necesarias
- ✅ Habitaciones (101-110)
- ✅ Usuarios por defecto:
  - **Administrador:** `manuel` / `manuel123`
  - **Usuario:** `daniela` / `daniela123`

#### Opción B: Solo Crear los Usuarios

Si la base de datos ya existe y solo necesitas crear los usuarios:

```bash
mysql -u root -p hotel_club
```

Luego ejecuta:
```sql
INSERT IGNORE INTO users_hotel (username, password, role) VALUES
  ('manuel', '$2b$10$rQJ5vZ9K7mN2L3.OXxYzKqW8rJ9fH5nL2mP4qR6sT8uV0wKYQ8Pj3x', 'Administrador'),
  ('daniela', '$2b$10$wA0L8oO3M4/PYyZALrX9sK0gI6oM3nQ5rS7tU9vW1xLZR9Qk4yHK6', 'Usuario');
```

**Nota:** Si tienes problemas con las contraseñas hasheadas, puedes restablecerlas usando el enlace "¿Olvidaste tu contraseña?" en la página de login.

### 3. Configuración del Archivo `.env`

Crea un archivo `.env` al mismo nivel del archivo de ejemplo `.env.example` y configura las variables necesarias para la conexión a la base de datos y otros servicios. Puedes guiarte con el contenido de `.env.example`.

**Ejemplo de configuración:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=hotel_club
DB_PORT=3306
```

**Nota:** También puedes configurar la conexión mediante variables de entorno (ver `src/config/configuration.js`).

## Instrucciones para Ejecutar el Proyecto

### Opción 1: Ejecutar Servicios por Separado

Abre **dos terminales** y ejecuta los siguientes comandos:

**Terminal 1 - Servidor de Desarrollo:**
```bash
npm run dev
```

**Terminal 2 - Compilador de TailwindCSS:**
```bash
npm run build
```

### Opción 2: Comandos Disponibles

- **`npm install`** - Instala todas las dependencias del proyecto
- **`npm run dev`** - Inicia el servidor de desarrollo
- **`npm run build`** - Compila los estilos de TailwindCSS

## Usuarios del Sistema

El script de base de datos crea automáticamente dos usuarios por defecto:

| Usuario | Contraseña | Rol | Permisos |
|---------|------------|-----|----------|
| **manuel** | manuel123 | Administrador | Acceso completo al sistema, gestión de usuarios, reportes |
| **daniela** | daniela123 | Usuario | Gestión de reservaciones y rentas |

### Recuperación de Contraseñas

Si tienes problemas para iniciar sesión con estos usuarios:

1. Ve a la página de login: `http://localhost:3000/login`
2. Haz clic en **"¿Olvidaste tu contraseña?"**
3. Ingresa el nombre de usuario (`manuel` o `daniela`)
4. Sigue las instrucciones para restablecer la contraseña

## Solución de Problemas Comunes

### Error: "Could not find Chrome"

Si recibes un error como:
```
Error: Could not find Chrome (ver. 140.0.7339.82)
```

**Solución:**
```bash
npx puppeteer browsers install chrome
```

Este comando descarga e instala Chrome/Chromium necesario para generar PDFs.

### Error de Conexión a MySQL

Si no puedes conectarte a la base de datos:

1. Verifica que MySQL esté corriendo:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl start mysql
   ```

2. Verifica las credenciales en el archivo `.env`

3. Asegúrate de que la base de datos `hotel_club` exista

### Los PDFs no se generan

1. Verifica que Chrome esté instalado para Puppeteer
2. Verifica que la carpeta `public/uploads/` tenga permisos de escritura
3. Revisa los logs del servidor para más detalles

## Notas Importantes

- ⚠️ Asegúrate de que el servidor de **MySQL** esté corriendo antes de iniciar el proyecto.
- ⚠️ Verifica que las credenciales de conexión en el archivo `.env` sean correctas.
- ⚠️ El proyecto requiere que la base de datos esté configurada correctamente para funcionar.
- 🔒 **Importante:** Cambia las contraseñas por defecto en un entorno de producción.
- 📁 Los archivos PDF y QR se guardan en `public/uploads/rooms/`
- 🌐 Chrome/Chromium se descarga automáticamente en `C:\Users\[Usuario]\.cache\puppeteer\`
