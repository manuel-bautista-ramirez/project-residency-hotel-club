-- =====================================================
-- SCRIPT COMPLETO DE BASE DE DATOS PARA HOTEL CLUB
-- Compatible con MariaDB/MySQL
-- =====================================================

-- Usar la base de datos
USE hotel_club;

-- =====================================================
-- ELIMINAR TABLAS EXISTENTES (SI NECESITAS RECREAR)
-- =====================================================
-- DROP TABLE IF EXISTS pagos;
-- DROP TABLE IF EXISTS membresias_activas;
-- DROP TABLE IF EXISTS membresias;
-- DROP TABLE IF EXISTS habitaciones;
-- DROP TABLE IF EXISTS metodos_pago;
-- DROP TABLE IF EXISTS tipos_membresia;
-- DROP TABLE IF EXISTS clientes;
-- DROP TABLE IF EXISTS users_hotel;

-- =====================================================
-- TABLA DE USUARIOS DEL SISTEMA
-- =====================================================
CREATE TABLE IF NOT EXISTS users_hotel (
    id_user SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Administrador', 'Usuario') DEFAULT 'Usuario',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DE TIPOS DE MEMBRESÍA
-- =====================================================
CREATE TABLE IF NOT EXISTS tipos_membresia (
    id_tipo_membresia SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    max_integrantes INTEGER DEFAULT 1 CHECK (max_integrantes >= 1),
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    duracion_meses INTEGER DEFAULT 1 CHECK (duracion_meses >= 1),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DE CLIENTES
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(100),
    fecha_nacimiento DATE,
    direccion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DE MEMBRESÍAS
-- =====================================================
CREATE TABLE IF NOT EXISTS membresias (
    id_membresia SERIAL PRIMARY KEY,
    id_cliente BIGINT UNSIGNED NOT NULL,
    id_tipo_membresia BIGINT UNSIGNED NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activa', 'vencida', 'cancelada') DEFAULT 'activa',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_membresia) REFERENCES tipos_membresia(id_tipo_membresia) ON DELETE RESTRICT
);

-- =====================================================
-- TABLA DE MEMBRESÍAS ACTIVAS
-- =====================================================
CREATE TABLE IF NOT EXISTS membresias_activas (
    id_activa SERIAL PRIMARY KEY,
    id_cliente BIGINT UNSIGNED NOT NULL,
    id_membresia BIGINT UNSIGNED NOT NULL,
    fecha_activacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activa', 'suspendida', 'cancelada') DEFAULT 'activa',
    notas TEXT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_membresia) REFERENCES membresias(id_membresia) ON DELETE CASCADE
);

-- =====================================================
-- TABLA DE MÉTODOS DE PAGO
-- =====================================================
CREATE TABLE IF NOT EXISTS metodos_pago (
    id_metodo_pago SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DE PAGOS
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos (
    id_pago SERIAL PRIMARY KEY,
    id_activa BIGINT UNSIGNED NOT NULL,
    id_metodo_pago BIGINT UNSIGNED NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    concepto VARCHAR(200) DEFAULT 'Pago de membresía',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comprobante VARCHAR(100),
    notas TEXT,
    FOREIGN KEY (id_activa) REFERENCES membresias_activas(id_activa) ON DELETE CASCADE,
    FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago) ON DELETE RESTRICT
);

-- =====================================================
-- TABLA DE HABITACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS habitaciones (
    id_habitacion SERIAL PRIMARY KEY,
    numero_habitacion VARCHAR(10) NOT NULL UNIQUE,
    tipo_habitacion ENUM('Individual', 'Doble', 'Suite', 'Familiar') NOT NULL,
    precio_noche DECIMAL(10,2) NOT NULL CHECK (precio_noche >= 0),
    capacidad_personas INTEGER DEFAULT 1 CHECK (capacidad_personas >= 1),
    descripcion TEXT,
    estado ENUM('disponible', 'ocupada', 'mantenimiento') DEFAULT 'disponible',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERTAR DATOS INICIALES
-- =====================================================

-- Insertar usuario administrador por defecto
INSERT INTO users_hotel (username, password, role) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador')
ON DUPLICATE KEY UPDATE username = username;

-- Insertar métodos de pago básicos
INSERT INTO metodos_pago (nombre, descripcion) VALUES
('Efectivo', 'Pago en efectivo'),
('Tarjeta de crédito', 'Pago con tarjeta de crédito'),
('Tarjeta de débito', 'Pago con tarjeta de débito'),
('Transferencia bancaria', 'Transferencia bancaria'),
('PayPal', 'Pago a través de PayPal')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar tipos de membresía básicos
INSERT INTO tipos_membresia (nombre, descripcion, max_integrantes, precio, duracion_meses) VALUES
('Individual GYM', 'Membresía individual para gimnasio', 1, 500.00, 1),
('Familiar GYM', 'Membresía familiar para gimnasio', 4, 1200.00, 1),
('Individual Completa', 'Acceso completo individual (GYM + Piscina + Spa)', 1, 800.00, 1),
('Familiar Completa', 'Acceso completo familiar (GYM + Piscina + Spa)', 4, 1800.00, 1),
('VIP Individual', 'Membresía VIP con todos los servicios', 1, 1500.00, 1),
('VIP Familiar', 'Membresía VIP familiar con todos los servicios', 6, 3000.00, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar habitaciones de ejemplo
INSERT INTO habitaciones (numero_habitacion, tipo_habitacion, precio_noche, capacidad_personas, descripcion) VALUES
('101', 'Individual', 150.00, 1, 'Habitación individual con vista al jardín'),
('102', 'Individual', 150.00, 1, 'Habitación individual con vista al jardín'),
('201', 'Doble', 250.00, 2, 'Habitación doble con balcón'),
('202', 'Doble', 250.00, 2, 'Habitación doble con balcón'),
('301', 'Suite', 450.00, 3, 'Suite con sala de estar y vista panorámica'),
('302', 'Suite', 450.00, 3, 'Suite con sala de estar y vista panorámica'),
('401', 'Familiar', 350.00, 4, 'Habitación familiar con dos camas dobles'),
('402', 'Familiar', 350.00, 4, 'Habitación familiar con dos camas dobles')
ON DUPLICATE KEY UPDATE numero_habitacion = VALUES(numero_habitacion);

-- Insertar clientes de ejemplo
INSERT INTO clientes (nombre_completo, telefono, correo, fecha_nacimiento, direccion) VALUES
('Juan Pérez García', '555-0101', 'juan.perez@email.com', '1985-03-15', 'Calle Principal 123, Ciudad'),
('María López Rodríguez', '555-0102', 'maria.lopez@email.com', '1990-07-22', 'Avenida Central 456, Ciudad'),
('Carlos Martínez Silva', '555-0103', 'carlos.martinez@email.com', '1988-11-08', 'Boulevard Norte 789, Ciudad'),
('Ana Gómez Torres', '555-0104', 'ana.gomez@email.com', '1992-05-30', 'Calle Sur 321, Ciudad')
ON DUPLICATE KEY UPDATE nombre_completo = VALUES(nombre_completo);

-- =====================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================
CREATE INDEX idx_clientes_correo ON clientes(correo);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_membresias_fecha_fin ON membresias(fecha_fin);
CREATE INDEX idx_membresias_activas_estado ON membresias_activas(estado);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX idx_habitaciones_estado ON habitaciones(estado);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de membresías con información completa
CREATE OR REPLACE VIEW vista_membresias_completa AS
SELECT 
    ma.id_activa,
    c.nombre_completo,
    c.telefono,
    c.correo,
    tm.nombre as tipo_membresia,
    tm.precio,
    m.fecha_inicio,
    m.fecha_fin,
    ma.estado,
    ma.fecha_activacion
FROM membresias_activas ma
JOIN clientes c ON ma.id_cliente = c.id_cliente
JOIN membresias m ON ma.id_membresia = m.id_membresia
JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia;

-- Vista de pagos con información completa
CREATE OR REPLACE VIEW vista_pagos_completa AS
SELECT 
    p.id_pago,
    c.nombre_completo,
    tm.nombre as tipo_membresia,
    p.monto,
    mp.nombre as metodo_pago,
    p.concepto,
    p.fecha_pago
FROM pagos p
JOIN membresias_activas ma ON p.id_activa = ma.id_activa
JOIN clientes c ON ma.id_cliente = c.id_cliente
JOIN membresias m ON ma.id_membresia = m.id_membresia
JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
JOIN metodos_pago mp ON p.id_metodo_pago = mp.id_metodo_pago;

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- Para verificar que todo se creó correctamente:
-- SHOW TABLES;
-- SELECT COUNT(*) FROM tipos_membresia;
-- SELECT COUNT(*) FROM metodos_pago;
-- SELECT COUNT(*) FROM habitaciones;
-- SELECT COUNT(*) FROM clientes;
