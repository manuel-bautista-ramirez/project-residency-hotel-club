# project-residency-hotel-club
- create database
  La base de datos esta en el script de database.db
  Hasta el momento yo he usado...

-- Nombre de la base de datos
CREATE DATABASE IF NOT EXISTS hotel_club;

-- Usar la base de datos
USE hotel_club;

-- Tabla de usuarios del hotel
CREATE TABLE users_hotel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE, -- Nombre de usuario único
  password VARCHAR(255) NOT NULL,       -- Contraseña cifrada
  role ENUM('SuperUsuario', 'Administrador', 'UsuarioNormal') NOT NULL -- Rol del usuario
);

-- Tabla de clientes (usuarios que son clientes)
CREATE TABLE user_cliente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL, -- ID del usuario que es cliente
  first_name VARCHAR(50) NOT NULL, -- Nombre del cliente
  last_name VARCHAR(50) NOT NULL, -- Apellido del cliente
  email VARCHAR(100) NOT NULL UNIQUE, -- Correo electrónico único
  phone VARCHAR(15), -- Teléfono del cliente
  FOREIGN KEY (user_id) REFERENCES users_hotel(id) ON DELETE CASCADE
);

-- Tabla de habitaciones
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE, -- Número de habitación único
  type ENUM('Individual', 'Doble', 'Suite') NOT NULL, -- Tipo de habitación
  price DECIMAL(10, 2) NOT NULL, -- Precio por noche
  status ENUM('Disponible', 'Ocupada', 'Reservada') NOT NULL DEFAULT 'Disponible' -- Estado de la habitación
);

-- Tabla de reservas
CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_cliente_id INT NOT NULL, -- ID del cliente que realiza la reserva
  room_id INT NOT NULL, -- ID de la habitación reservada
  start_date DATE NOT NULL, -- Fecha de inicio de la reserva
  end_date DATE NOT NULL, -- Fecha de fin de la reserva
  status ENUM('Pendiente', 'Confirmada', 'Cancelada') NOT NULL DEFAULT 'Pendiente', -- Estado de la reserva
  FOREIGN KEY (user_cliente_id) REFERENCES user_cliente(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

- install depencebcias.
   comands : npm install
   correr entorno de desarrollo tanto del servidor como de tailwindCSS.
   SERVIDR COMMAN: npm run dev
   Estilos de TailwindCSS COMMAND: npm run build


Nota si no crean la base de datos no podran correr el proyecto, asì mismo si no insertan los usuarios por defecto que he declarado en el modelo de los usuarios...
Pordefecto los usarios se crean al correr el proyecto... SOlo se crean una vez... Ya esta valiado eso... Si ya existen en la tabla ya no se crean..

Pero igual nececitan segurase de que todo funcione bien..




