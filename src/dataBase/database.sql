-- ======= Creación de la base y uso =======
CREATE DATABASE IF NOT EXISTS hotel_club DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
USE hotel_club;

-- =====================================================
--               MODULE LOGIN
-- =======================================================

CREATE TABLE IF NOT EXISTS users_hotel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NULL COMMENT 'NULL = usuario debe crear contraseña en primer login',
  email VARCHAR(100) NULL UNIQUE,
  role ENUM('Administrador','Usuario') NOT NULL,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO users_hotel (username, password, email, role) VALUES
  ('manuel', NULL, 'victor.m.r.b.2000@gmail.com', 'Administrador'),
  ('daniela', NULL, 'iscvictormanuelramirezbautista@gmail.com', 'Usuario');


-- si te da error solo  restablece la contraseña. en el link de abajo del login

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(6) NOT NULL UNIQUE COMMENT 'Código de 6 dígitos para recuperación',
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_password_resets_user (user_id),
  KEY idx_password_resets_expires (expires_at),
  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id) REFERENCES users_hotel (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
--               MÓDULO DE HABITACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS habitaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(10) NOT NULL UNIQUE,
  tipo ENUM('sencilla','suite') NOT NULL,
  estado ENUM('disponible','ocupado','limpieza') DEFAULT 'disponible'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar habitaciones (idempotente)
INSERT IGNORE INTO habitaciones (numero, tipo) VALUES
  ('101','sencilla'),('102','sencilla'),('103','sencilla'),('104','sencilla'),
  ('106','sencilla'),('107','sencilla'),('108','sencilla'),('109','sencilla'),
  ('105','suite'),('110','suite');


CREATE TABLE IF NOT EXISTS precios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_habitacion ENUM('sencilla','suite') NOT NULL,
  mes INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tipo_mes (tipo_habitacion, mes),
  CONSTRAINT chk_precio_mes CHECK (mes BETWEEN 1 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar precios (idempotente)
INSERT IGNORE INTO precios (tipo_habitacion, mes, monto) VALUES
  ('sencilla', 1, 100.00),('sencilla', 2, 100.00),('sencilla', 3, 120.00),('sencilla', 4, 120.00),
  ('sencilla', 5, 150.00),('sencilla', 6, 150.00),('sencilla', 7, 200.00),('sencilla', 8, 200.00),
  ('sencilla', 9, 150.00),('sencilla',10,150.00),('sencilla',11,120.00),('sencilla',12,120.00),
  ('suite', 1, 200.00),('suite', 2, 200.00),('suite', 3, 250.00),('suite', 4, 250.00),
  ('suite', 5, 300.00),('suite', 6, 300.00),('suite', 7, 400.00),('suite', 8, 400.00),
  ('suite', 9, 300.00),('suite',10,300.00),('suite',11,250.00),('suite',12,250.00);


CREATE TABLE IF NOT EXISTS medios_mensajes (
  id_medio_mensaje INT AUTO_INCREMENT PRIMARY KEY,
  correo_cliente VARCHAR(100) NOT NULL,
  telefono_cliente VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS reservaciones (
  id INT NOT NULL AUTO_INCREMENT,
  habitacion_id INT NOT NULL,
  usuario_id INT NOT NULL,
  id_medio_mensaje INT NOT NULL,
  nombre_cliente VARCHAR(100) NOT NULL,

  -- Fecha de creación de la reservación (para reportes por día/semana/mes)
  fecha_reserva DATETIME NOT NULL,

  -- Fechas de estancia
  fecha_ingreso DATETIME NOT NULL,
  fecha_salida DATETIME NOT NULL,

  -- Monto total de la reservación
  monto DECIMAL(10,2) NOT NULL,
  monto_letras VARCHAR(255) NOT NULL,

  -- Enganche / anticipo
  enganche DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto del enganche/anticipo pagado',
  enganche_letras VARCHAR(255) DEFAULT '' COMMENT 'Enganche en letras',

  -- Registro y archivos
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_path VARCHAR(500) NULL COMMENT 'Ruta del archivo PDF generado',
  qr_path VARCHAR(500) NULL COMMENT 'Ruta del archivo QR generado',

  -- Estado de la reservación para flujo e historial
  -- pendiente  : creada pero aún no confirmada (si lo usas)
  -- confirmada : reservación vigente normal
  -- convertida_a_renta : ya se convirtió en renta (ya no se muestra en lista, pero sí en reportes)
  -- cancelada  : cancelada por el usuario/admin
  estado ENUM('pendiente','confirmada','convertida_a_renta','cancelada')
    NOT NULL DEFAULT 'confirmada',

  -- Relación opcional con la renta generada a partir de esta reservación
  id_renta INT NULL,

  PRIMARY KEY (id),

  -- Índices para joins y filtros
  INDEX idx_habitacion (habitacion_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_medio_mensaje (id_medio_mensaje),

  -- Índices para reportes/estado
  INDEX idx_reservaciones_estado (estado),
  INDEX idx_reservaciones_id_renta (id_renta),

  CONSTRAINT fk_reservaciones_habitacion
    FOREIGN KEY (habitacion_id)
    REFERENCES habitaciones (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_reservaciones_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES users_hotel (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_reservaciones_medio_mensaje
    FOREIGN KEY (id_medio_mensaje)
    REFERENCES medios_mensajes (id_medio_mensaje)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS rentas (
  id INT NOT NULL AUTO_INCREMENT,
  habitacion_id INT NOT NULL,
  usuario_id INT NOT NULL,
  id_medio_mensaje INT NOT NULL,
  nombre_cliente VARCHAR(100) NOT NULL,
  fecha_ingreso DATETIME NOT NULL,
  fecha_salida DATETIME NOT NULL,
  tipo_pago ENUM('tarjeta','transferencia','efectivo') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  monto_letras VARCHAR(255) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_path VARCHAR(500) NULL,
  qr_path VARCHAR(500) NULL,
  estado ENUM('activa', 'finalizada', 'cancelada') DEFAULT 'activa',
  fecha_salida_real DATETIME NULL COMMENT 'Fecha y hora real en que se desocupó la habitación',

  PRIMARY KEY (id),
  INDEX idx_habitacion (habitacion_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_medio_mensaje (id_medio_mensaje),
  INDEX idx_rentas_estado (estado),

  CONSTRAINT fk_rentas_habitacion
    FOREIGN KEY (habitacion_id)
    REFERENCES habitaciones (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_rentas_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES users_hotel (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_rentas_medio_mensaje
    FOREIGN KEY (id_medio_mensaje)
    REFERENCES medios_mensajes (id_medio_mensaje)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación opcional: reservación -> renta generada
ALTER TABLE reservaciones
  ADD CONSTRAINT fk_reservaciones_renta
    FOREIGN KEY (id_renta)
    REFERENCES rentas (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS pdf_registry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rent_id INT NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  room_number VARCHAR(10) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT DEFAULT 0,
  qr_data TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_whatsapp BOOLEAN DEFAULT FALSE,
  sent_email BOOLEAN DEFAULT FALSE,
  status ENUM('generated','sent','error') DEFAULT 'generated',
  INDEX idx_rent_id (rent_id),
  INDEX idx_client_name (client_name),
  INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service VARCHAR(100) NOT NULL,
  payload TEXT NOT NULL,
  status ENUM('pending','processing','completed','failed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_attempt_at DATETIME DEFAULT NULL,
  attempts INT DEFAULT 0,
  error_message TEXT DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- MÓDULO DE MEMBRESÍAS
-- =====================================================

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    correo VARCHAR(100) DEFAULT NULL,
    fecha_registro TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tipos_membresia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  max_integrantes INT DEFAULT 1,
  precio DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS integrantes_membresia (
    id_integrante BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_activa INT NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    fecha_registro TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS membresias (
    id_membresia BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_tipo_membresia INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE tipos_membresia RENAME COLUMN id TO id_tipo_membresia;

CREATE TABLE IF NOT EXISTS membresias_activas (
    id_activa BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_membresia INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    precio_final DECIMAL(10,2) NOT NULL,
    qr_path VARCHAR(255) DEFAULT NULL,
    estado VARCHAR(20) DEFAULT 'Activa',
    KEY idx_qr_path (qr_path),
    CONSTRAINT membresias_activas_chk_1 CHECK (precio_final > 0),
    CONSTRAINT membresias_activas_chk_2 CHECK (estado IN ('Activa','Vencida','Cancelada')),
    CONSTRAINT membresias_activas_chk_3 CHECK (fecha_fin > fecha_inicio)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metodos_pago (
    id_metodo_pago BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pagos (
    id_pago BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_activa INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pagos_chk_1 CHECK (monto > 0)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NUEVO MÓDULO DE REGISTRO DE ACCESOS POR MEMBRESÍA
-- =====================================================
CREATE TABLE IF NOT EXISTS registro_entradas (
  `id_entrada` INT AUTO_INCREMENT PRIMARY KEY,
  `id_activa` BIGINT UNSIGNED NOT NULL,
  `fecha_hora_entrada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `area_acceso` VARCHAR(50) NULL,
  CONSTRAINT `fk_entrada_membresia`
    FOREIGN KEY (`id_activa`)
    REFERENCES `membresias_activas` (`id_activa`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar métodos de pago
INSERT IGNORE INTO metodos_pago (nombre) VALUES
('Efectivo'),('Tarjeta de crédito'),('Transferencia bancaria');

-- Insertar tipos de membresía
INSERT IGNORE INTO tipos_membresia (nombre, descripcion, max_integrantes, precio) VALUES
('Individual GYM','Membresía para una persona',1,500.00),
('Individual Alberca','Membresía para una persona',1,500.00),
('Individual General','Membresía para una persona',1,500.00),
('Familiar','Membresía para toda la familia',4,1200.00);

-- =====================================================
--               MÓDULO DE TIENDA (STORE)
-- =====================================================

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria ENUM('bebidas', 'snacks', 'comida', 'otros') NOT NULL DEFAULT 'otros',
  precio DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  imagen VARCHAR(500),
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categoria (categoria),
  INDEX idx_stock (stock),
  INDEX idx_precio (precio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  id_medio_mensaje INT NULL,
  nombre_cliente VARCHAR(255) NOT NULL,
  tipo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  total_letras VARCHAR(500),
  pdf_path VARCHAR(500),
  qr_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fecha_venta (created_at),
  INDEX idx_tipo_pago (tipo_pago),
  INDEX idx_usuario (usuario_id),
  FOREIGN KEY (usuario_id) REFERENCES users_hotel(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de detalles de venta
CREATE TABLE IF NOT EXISTS venta_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  INDEX idx_venta (venta_id),
  INDEX idx_producto (producto_id),
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Insertar productos de ejemplo
INSERT IGNORE INTO productos (id, nombre, descripcion, categoria, precio, stock) VALUES
-- Bebidas
(1, 'Coca Cola 600ml', 'Refresco de cola 600ml', 'bebidas', 25.00, 50),
(2, 'Agua Natural 1L', 'Agua purificada 1 litro', 'bebidas', 15.00, 100),
(3, 'Pepsi 600ml', 'Refresco de cola Pepsi', 'bebidas', 25.00, 40),
(4, 'Jugo de Naranja', 'Jugo natural de naranja 500ml', 'bebidas', 30.00, 25),
(5, 'Café Americano', 'Café americano caliente', 'bebidas', 20.00, 0),
(6, 'Cerveza Corona', 'Cerveza Corona 355ml', 'bebidas', 35.00, 30),

-- Snacks
(7, 'Sabritas Original', 'Papas fritas sabor natural', 'snacks', 18.00, 30),
(8, 'Galletas Oreo', 'Galletas de chocolate con crema', 'snacks', 22.00, 25),
(9, 'Chocolate Snickers', 'Barra de chocolate con cacahuates', 'snacks', 24.00, 35),
(10, 'Galletas Marías', 'Paquete de galletas marías', 'snacks', 12.00, 40),
(11, 'Doritos Nacho', 'Tortillas de maíz sabor nacho', 'snacks', 20.00, 28),

-- Comida
(12, 'Sandwich Club', 'Sandwich de pollo, jamón y queso', 'comida', 65.00, 15),
(13, 'Torta Cubana', 'Torta especial con todos los ingredientes', 'comida', 55.00, 10),
(14, 'Quesadilla', 'Quesadilla de queso con guacamole', 'comida', 45.00, 20),
(15, 'Hot Dog', 'Hot dog con papas fritas', 'comida', 40.00, 18),
(16, 'Ensalada César', 'Ensalada césar con pollo', 'comida', 50.00, 12),

-- Otros
(17, 'Aspirina', 'Analgésico para dolor de cabeza', 'otros', 15.00, 20),
(18, 'Protector Solar', 'Bloqueador solar FPS 50', 'otros', 80.00, 15),
(19, 'Toalla de Playa', 'Toalla grande para alberca', 'otros', 120.00, 8),
(20, 'Gafas de Sol', 'Lentes de sol UV protection', 'otros', 150.00, 12);

CREATE TABLE daily_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  -- El ENUM ahora incluye las opciones en español e inglés
  area ENUM('Courts', 'Pool', 'Gym', 'Canchas', 'Alberca', 'Gimnasio') NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  -- Columna agregada mediante el primer ALTER
  payment_method VARCHAR(20) NOT NULL,
  entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users_hotel(id)
);

-- =====================================================
--           TABLA DE CONFIGURACIONES (SETTINGS)
-- =====================================================

CREATE TABLE settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value DECIMAL(10,2) NOT NULL
);

-- Inserción de precios base
INSERT INTO settings (setting_key, setting_value) VALUES
('price_canchas', 60.00),
('price_alberca', 100.00),
('price_gym', 40.00);
