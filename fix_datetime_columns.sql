-- Script para cambiar las columnas DATE a DATETIME
-- Esto permitirá guardar fecha y hora en las tablas

-- Modificar tabla reservaciones
ALTER TABLE reservaciones 
  MODIFY COLUMN fecha_reserva DATETIME NOT NULL,
  MODIFY COLUMN fecha_ingreso DATETIME NOT NULL,
  MODIFY COLUMN fecha_salida DATETIME NOT NULL;

-- Modificar tabla rentas
ALTER TABLE rentas 
  MODIFY COLUMN fecha_ingreso DATETIME NOT NULL,
  MODIFY COLUMN fecha_salida DATETIME NOT NULL;

-- Verificar los cambios
DESCRIBE reservaciones;
DESCRIBE rentas;
