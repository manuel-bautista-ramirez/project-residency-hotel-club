# Project Residency Hotel Club

Sistema de gestión para hotel club con funcionalidades de reservaciones, membresías y administración.

## Requisitos Previos

- **Node.js** (versión recomendada: 14 o superior)
- **MySQL** (servidor de base de datos)
- **npm** (gestor de paquetes de Node.js)

## Configuración Inicial

### 1. Instalación de Dependencias

Ejecuta el siguiente comando en el directorio raíz del proyecto:

```bash
npm install
```

### 2. Configuración del Archivo `.env`

Crea un archivo `.env` al mismo nivel del archivo de ejemplo `.env.example` y configura las variables necesarias para la conexión a la base de datos y otros servicios. Puedes guiarte con el contenido de `.env.example`.

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

## Notas Importantes

- Asegúrate de que el servidor de **MySQL** esté corriendo antes de iniciar el proyecto.
- Verifica que las credenciales de conexión en el archivo `.env` sean correctas.
- El proyecto requiere que la base de datos esté configurada correctamente para funcionar.
