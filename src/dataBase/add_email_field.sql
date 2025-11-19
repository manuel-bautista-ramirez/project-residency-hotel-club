-- Agregar campo email a la tabla users_hotel y permitir password NULL
USE hotel_club;

-- Agregar columna email (puede ser NULL inicialmente para usuarios existentes)
ALTER TABLE users_hotel 
ADD COLUMN email VARCHAR(100) NULL UNIQUE AFTER password;

-- Modificar columna password para permitir NULL (usuarios sin contraseña inicial)
ALTER TABLE users_hotel
MODIFY COLUMN password VARCHAR(255) NULL COMMENT 'NULL = usuario debe crear contraseña en primer login';

-- Actualizar usuarios existentes con emails de ejemplo (opcional)
UPDATE users_hotel SET email = 'victor.m.r.b.2000@gmail.com' WHERE username = 'manuel';
UPDATE users_hotel SET email = 'iscvictormanuelramirezbautista@gmail.com' WHERE username = 'daniela';

-- Modificar tabla password_resets para usar códigos en lugar de tokens largos
ALTER TABLE password_resets 
MODIFY COLUMN token VARCHAR(6) NOT NULL COMMENT 'Código de 6 dígitos para recuperación';

-- Agregar índice para email
CREATE INDEX idx_users_email ON users_hotel(email);

SELECT * FROM users_hotel;
