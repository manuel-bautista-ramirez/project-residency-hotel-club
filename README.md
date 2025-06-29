# project-residency-hotel-club

Crear la base de datos... En tu gestor de base de datos MySQL, puedes usar el siguiente script SQL para crear la base de datos y las tablas necesarias:



```sql
 CREATE DATABASE IF NOT EXISTS hotel_club;

 USE hotel_club;
 CREATE TABLE
  users_hotel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE, -- Nombre de usuario único
    password VARCHAR(255) NOT NULL, -- Contraseña cifrada
    role ENUM ('SuperUsuario', 'Administrador', 'UsuarioNormal') NOT NULL -- Rol del usuario
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

La base de datos esta en el script de database.db

# Instrucciones para correr el proyecto

- comandos instalar las dependencias..
- Ejecutar los comandos en la terminal para instalar las dependencias del proyecto en el directorio raìz del proyecto:
```bash
    npm install : Para instalar todas las dependencias del proyecto.
    npm run dev : Para correr el entorno de desarrollo del servidor.
    npm run build :Para compilar los estilos de TailwindCSS.
```
- Asegurarse de que la base de datos MySQL esté corriendo y que las credenciales de conexión estén correctamente configuradas en el archivo `.env`.

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

# Nota: Asegurarse de que el servidor de MySQL esté corriendo y que las credenciales de conexión estén correctamente configuradas en el archivo `.env`.

Nota: si no crean la base de datos no podran correr el proyecto, asì mismo si no insertan los usuarios por defecto que he declarado en el modelo de los usuarios...
Pordefecto los usarios se crean al correr el proyecto... SOlo se crean una vez... Ya esta valiado eso... Si ya existen en la tabla ya no se crean..

Pero igual nececitan segurase de que todo funcione bien..
