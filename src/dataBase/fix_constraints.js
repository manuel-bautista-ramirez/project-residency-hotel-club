import mysql from 'mysql2/promise';
import { config } from '../config/configuration.js';

/*
  Fix engines to InnoDB and add missing foreign keys for rentas/reservaciones.
  - Non-destructive: does not drop tables or data.
  - Idempotent: checks existence before creating FKs.
*/

async function ensureEngineInnoDB(conn, table) {
  try {
    const [rows] = await conn.query(
      `SELECT ENGINE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?`,
      [config.mysql.database, table]
    );
    const current = rows[0]?.ENGINE || '';
    if (String(current).toLowerCase() !== 'innodb') {
      console.log(`⚙️  Cambiando ENGINE de ${table} -> InnoDB`);
      await conn.query(`ALTER TABLE \`${table}\` ENGINE=InnoDB`);
    } else {
      console.log(`✅ ENGINE ya es InnoDB en ${table}`);
    }
  } catch (e) {
    console.warn(`⚠️  No se pudo asegurar InnoDB en ${table}: ${e.message}`);
  }
}

async function fkExistsByColumn(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE CONSTRAINT_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=? 
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [config.mysql.database, table, column]
  );
  return (rows[0]?.c ?? 0) > 0;
}

async function addFkIfMissing(conn, { table, column, refTable, refColumn = 'id', name }) {
  const exists = await fkExistsByColumn(conn, table, column);
  if (exists) {
    console.log(`✅ FK existente: ${table}.${column} -> ${refTable}.${refColumn}`);
    return;
  }
  // MySQL requiere índice en la columna hija; si no existe, se crea automáticamente con la FK
  const fkName = name || `fk_${table}_${column}`;
  const sql = `ALTER TABLE \`${table}\` 
    ADD CONSTRAINT \`${fkName}\` FOREIGN KEY (\`${column}\`) 
    REFERENCES \`${refTable}\`(\`${refColumn}\`)`;
  try {
    await conn.query(sql);
    console.log(`🔗 FK creada: ${table}.${column} -> ${refTable}.${refColumn}`);
  } catch (e) {
    console.error(`❌ Error creando FK ${fkName} en ${table}.${column}: ${e.message}`);
  }
}

async function run() {
  const conn = await mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    multipleStatements: true,
  });

  console.log('✅ Conectado al servidor de MySQL.');

  try {
    // 1) Asegurar ENGINE InnoDB en tablas que lo requieren
    const toInno = [
      'users_hotel',
      'habitaciones',
      'precios',
      'medios_mensajes',
      'reservaciones',
      'rentas',
    ];
    for (const t of toInno) {
      await ensureEngineInnoDB(conn, t);
    }

    // 2) Asegurar Foreign Keys en reservaciones y rentas
    await addFkIfMissing(conn, { table: 'reservaciones', column: 'habitacion_id', refTable: 'habitaciones', refColumn: 'id' });
    await addFkIfMissing(conn, { table: 'reservaciones', column: 'usuario_id',    refTable: 'users_hotel',  refColumn: 'id' });
    await addFkIfMissing(conn, { table: 'reservaciones', column: 'id_medio_mensaje', refTable: 'medios_mensajes', refColumn: 'id_medio_mensaje' });

    await addFkIfMissing(conn, { table: 'rentas', column: 'habitacion_id', refTable: 'habitaciones', refColumn: 'id' });
    await addFkIfMissing(conn, { table: 'rentas', column: 'usuario_id',    refTable: 'users_hotel',  refColumn: 'id' });
    await addFkIfMissing(conn, { table: 'rentas', column: 'id_medio_mensaje', refTable: 'medios_mensajes', refColumn: 'id_medio_mensaje' });

    console.log('🚀 Correcciones aplicadas (ENGINE/FKs).');
  } catch (e) {
    console.error('❌ Error durante la corrección de constraints:', e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
    console.log('🔌 Conexión cerrada.');
  }
}

run();
