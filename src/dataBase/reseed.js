import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/configuration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function reseed() {
  const connection = await mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    multipleStatements: true,
  });

  console.log('✅ Conectado al servidor de MySQL.');

  try {
    const sqlFilePath = path.join(__dirname, 'database.db');
    let sqlScript = await fs.readFile(sqlFilePath, 'utf-8');

    // Limpiar comentarios
    sqlScript = sqlScript.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');

    // Dividir y filtrar solo INSERTs
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => /^INSERT\s+/i.test(s) || /^INSERT\s+IGNORE\s+/i.test(s));

    console.log(`🔍 Se encontraron ${statements.length} sentencias INSERT para ejecutar.`);

    let success = 0;
    let failed = 0;

    for (const [idx, stmt] of statements.entries()) {
      try {
        await connection.query(stmt);
        success++;
      } catch (err) {
        // Tolerar duplicados
        if (/(ER_DUP_ENTRY|Duplicate entry)/.test(err.message)) {
          console.warn(`⚠️  INSERT duplicado omitido (#${idx + 1}).`);
          continue;
        }
        console.error(`❌ Error en INSERT #${idx + 1}: ${err.message}`);
        failed++;
      }
    }

    console.log(`✅ INSERTs aplicados: ${success}`);
    if (failed > 0) console.log(`❗ INSERTs con error: ${failed}`);
    console.log('🚀 Reseed completado.');
  } catch (error) {
    console.error('❌ Error durante el reseed:', error.message);
  } finally {
    await connection.end();
    console.log('🔌 Conexión cerrada.');
  }
}

reseed();
