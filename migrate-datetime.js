import { pool } from './src/dataBase/connectionDataBase.js';

async function migrateDateTimeColumns() {
  console.log('🔄 Iniciando migración de columnas DATE a DATETIME...\n');
  
  try {
    // Modificar tabla reservaciones
    console.log('📝 Modificando tabla reservaciones...');
    await pool.query(`
      ALTER TABLE reservaciones 
        MODIFY COLUMN fecha_reserva DATETIME NOT NULL,
        MODIFY COLUMN fecha_ingreso DATETIME NOT NULL,
        MODIFY COLUMN fecha_salida DATETIME NOT NULL
    `);
    console.log('✅ Tabla reservaciones modificada correctamente\n');
    
    // Modificar tabla rentas
    console.log('📝 Modificando tabla rentas...');
    await pool.query(`
      ALTER TABLE rentas 
        MODIFY COLUMN fecha_ingreso DATETIME NOT NULL,
        MODIFY COLUMN fecha_salida DATETIME NOT NULL
    `);
    console.log('✅ Tabla rentas modificada correctamente\n');
    
    // Verificar los cambios en reservaciones
    console.log('🔍 Verificando cambios en reservaciones...');
    const [reservacionesColumns] = await pool.query('DESCRIBE reservaciones');
    const fechaReserva = reservacionesColumns.find(col => col.Field === 'fecha_reserva');
    const fechaIngreso = reservacionesColumns.find(col => col.Field === 'fecha_ingreso');
    const fechaSalida = reservacionesColumns.find(col => col.Field === 'fecha_salida');
    
    console.log('  - fecha_reserva:', fechaReserva?.Type);
    console.log('  - fecha_ingreso:', fechaIngreso?.Type);
    console.log('  - fecha_salida:', fechaSalida?.Type);
    console.log('');
    
    // Verificar los cambios en rentas
    console.log('🔍 Verificando cambios en rentas...');
    const [rentasColumns] = await pool.query('DESCRIBE rentas');
    const rentaIngreso = rentasColumns.find(col => col.Field === 'fecha_ingreso');
    const rentaSalida = rentasColumns.find(col => col.Field === 'fecha_salida');
    
    console.log('  - fecha_ingreso:', rentaIngreso?.Type);
    console.log('  - fecha_salida:', rentaSalida?.Type);
    console.log('');
    
    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('✨ Ahora las fechas pueden almacenar hora (12:00 PM)');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Ejecutar migración
migrateDateTimeColumns();
