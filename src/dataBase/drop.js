import mysql from 'mysql2/promise';
import { config } from '../config/configuration.js';

/*
  Ultra-safe DB dropper for MySQL.
  Refuses to run unless ALL conditions are met:
  - NODE_ENV !== 'production'  OR  DB_DROP_OVERRIDE === 'true'
  - DB_CONFIRM === exact database name (e.g. 'hotel_club')
  - DB_ALLOW_DROP === 'true'
*/

function assertSafety() {
  const dbName = config.mysql.database;
  const { NODE_ENV, DB_CONFIRM, DB_ALLOW_DROP, DB_DROP_OVERRIDE } = process.env;

  const isProd = String(NODE_ENV).toLowerCase() === 'production';
  const override = String(DB_DROP_OVERRIDE).toLowerCase() === 'true';

  if (isProd && !override) {
    throw new Error("Drop bloqueado: NODE_ENV=production. Establece DB_DROP_OVERRIDE=true solo si entiendes los riesgos.");
  }
  if (String(DB_ALLOW_DROP).toLowerCase() !== 'true') {
    throw new Error("Drop bloqueado: Debes establecer DB_ALLOW_DROP=true para permitir la eliminación de la base de datos.");
  }
  if (!DB_CONFIRM || DB_CONFIRM !== dbName) {
    throw new Error(`Drop bloqueado: Debes establecer DB_CONFIRM exactamente a '${dbName}'.`);
  }
}

async function dropDatabase() {
  assertSafety();

  const { host, user, password, database } = config.mysql;
  const conn = await mysql.createConnection({ host, user, password, multipleStatements: true });
  console.log('✅ Conectado al servidor de MySQL.');
  try {
    console.log(`⚠️  Eliminando base de datos si existe: ${database}`);
    await conn.query(`DROP DATABASE IF EXISTS \`${database}\``);
    console.log('✅ Base de datos eliminada.');
  } catch (err) {
    console.error('❌ Error al eliminar la base de datos:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
    console.log('🔌 Conexión cerrada.');
  }
}

// Run
dropDatabase();
