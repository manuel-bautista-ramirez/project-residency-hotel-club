import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/configuration.js';

// Modo de recreación de tablas: si está en true, hará DROP TABLE IF EXISTS antes de cada CREATE TABLE
// Controlable con la variable de entorno DB_FORCE_RECREATE=true
// Ahora por defecto en 'false' para no perder datos tras la primera instalación.
const FORCE_RECREATE = String(process.env.DB_FORCE_RECREATE || 'false').toLowerCase() === 'true';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  // 1. Conexión sin seleccionar la base de datos y permitiendo múltiples sentencias
  const connection = await mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    multipleStatements: true, // ¡Importante para ejecutar el script completo!
  });

  console.log('✅ Conectado al servidor de MySQL.');

  try {
    // 2. Leer el script SQL
    const sqlFilePath = path.join(__dirname, 'database.db');
    let sqlScript = await fs.readFile(sqlFilePath, 'utf-8');

    // Limpiar el script de comentarios ANTES de dividirlo
    sqlScript = sqlScript.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');

    console.log('📄 Script de base de datos leído y limpiado correctamente.');

    // 3. Dividir el script en sentencias individuales
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`🔍 Se encontraron ${statements.length} sentencias SQL para ejecutar.`);

    // 4. Ejecutar cada sentencia una por una con tolerancia a errores esperables
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const failures = [];

    for (const [index, original] of statements.entries()) {
      // Añadir IF NOT EXISTS a CREATE TABLE que no lo tengan
      let statement = original.replace(/CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i, 'CREATE TABLE IF NOT EXISTS ');

      try {
        // Si es un CREATE TABLE y FORCE_RECREATE está activo, hacemos DROP previo
        if (FORCE_RECREATE && /CREATE\s+TABLE/i.test(statement)) {
          // Extraer el nombre de la tabla después de CREATE TABLE [IF NOT EXISTS]
          const m = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_\.]+)`?/i);
          const tableName = m && m[1] ? m[1] : '';
          const upper = tableName.toUpperCase();
          if (tableName && upper !== 'IF' && upper !== 'EXISTS') {
            try {
              await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
              // console.log(`   (Recreación) Tabla eliminada si existía: ${tableName}`);
            } catch (dropErr) {
              // Continuar aunque el DROP falle por alguna razón
              console.warn(`⚠️  No se pudo eliminar la tabla ${tableName} antes de recrear: ${dropErr.message}`);
            }
          }
        }

        await connection.query(statement);
        successCount++;
      } catch (error) {
        const code = error && error.code ? error.code : '';
        const msg = (error && error.message) ? error.message : '';
        const preview = statement.substring(0, 120).replace(/\s+/g, ' ');

        // Errores tolerables para continuar (tabla ya existe, índices duplicados, etc.)
        const tolerable = [
          'ER_TABLE_EXISTS_ERROR',
          'ER_DUP_KEYNAME',
          'ER_DUP_ENTRY',
          'ER_CANT_CREATE_TABLE', // a veces crea aunque reporte conflicto menor
        ];

        if (tolerable.includes(code) || /already exists/i.test(msg)) {
          console.warn(`⚠️  Omitiendo sentencia #${index + 1} por condición esperada (${code || 'already exists'}): ${preview}...`);
          skippedCount++;
          continue;
        }

        // Registrar fallo real y continuar con el resto
        console.error(`❌ Error en la sentencia #${index + 1}: ${preview}... -> ${msg}`);
        failedCount++;
        failures.push({ index: index + 1, code, msg, preview });
        continue;
      }
    }

    // Verificación post-instalación
    const requiredTables = [
      'users_hotel',
      'habitaciones',
      'precios',
      'medios_mensajes',
      'reservaciones',
      'rentas',
      'pdf_registry',
      'password_resets',
      'clientes',
      'integrantes_membresia',
      'membresias',
      'membresias_activas',
      'metodos_pago',
      'pagos',
      'tipos_membresia'
    ];

    const [tablesRows] = await connection.query(`SHOW TABLES FROM \`${config.mysql.database}\``);
    const tableKey = Object.keys(tablesRows[0] || {})[0] || `Tables_in_${config.mysql.database}`;
    const existing = new Set(tablesRows.map(r => r[tableKey]));
    const missing = requiredTables.filter(t => !existing.has(t));

    console.log(`\n🔎 Verificación de tablas requeridas:`);
    console.log(`   - Encontradas: ${requiredTables.length - missing.length}/${requiredTables.length}`);
    if (missing.length) {
      console.warn(`   - Faltantes: ${missing.join(', ')}`);
    } else {
      console.log('   - Todas las tablas requeridas están presentes.');
    }

    // Métricas rápidas de catálogos clave (no interrumpe si fallan)
    const quickCounts = [
      'metodos_pago',
      'tipos_membresia',
      'habitaciones'
    ];
    for (const t of quickCounts) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as c FROM \`${t}\``);
        console.log(`   - ${t}: ${rows[0]?.c ?? 0} registros`);
      } catch (_) { /* ignore */ }
    }

    // Validación de índices y llaves (no interrumpe si fallan)
    console.log('\n🧪 Validación de índices y llaves clave:');
    // Helper: revisar si existe índice/constraint por nombre
    async function hasIndex(table, indexName) {
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?`,
          [config.mysql.database, table, indexName]
        );
        return (rows[0]?.c ?? 0) > 0;
      } catch { return false; }
    }
    async function hasForeignKey(table, constraintName) {
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=? AND TABLE_NAME=? AND CONSTRAINT_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL`,
          [config.mysql.database, table, constraintName]
        );
        return (rows[0]?.c ?? 0) > 0;
      } catch { return false; }
    }

    // Índices únicos esperados
    const checks = [
      { type: 'index', table: 'tipos_membresia', name: 'nombre', desc: 'UNIQUE(nombre) en tipos_membresia' },
      { type: 'index', table: 'users_hotel', name: 'username', desc: 'UNIQUE(username) en users_hotel' },
    ];

    for (const chk of checks) {
      if (chk.type === 'index') {
        const ok = await hasIndex(chk.table, chk.name);
        console.log(`   - ${chk.desc}: ${ok ? 'OK' : 'FALTA'}`);
      }
    }

    // Llaves foráneas esperadas (nombres por convención MySQL pueden ser generados; validamos por columna como fallback)
    async function fkExistsByColumn(table, column) {
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL`,
          [config.mysql.database, table, column]
        );
        return (rows[0]?.c ?? 0) > 0;
      } catch { return false; }
    }

    const fkCols = [
      { table: 'reservaciones', column: 'habitacion_id' },
      { table: 'reservaciones', column: 'usuario_id' },
      { table: 'reservaciones', column: 'id_medio_mensaje' },
      { table: 'rentas', column: 'habitacion_id' },
      { table: 'rentas', column: 'usuario_id' },
      { table: 'rentas', column: 'id_medio_mensaje' },
    ];
    for (const fk of fkCols) {
      const ok = await fkExistsByColumn(fk.table, fk.column);
      console.log(`   - FK ${fk.table}.${fk.column}: ${ok ? 'OK' : 'FALTA'}`);
    }

    // Validación de columnas (existencia y tipo básico)
    console.log('\n🧩 Validación de columnas (existencia/tipo):');
    const expectedSchema = {
      users_hotel: [
        { name: 'id', type: 'int' },
        { name: 'username', type: 'varchar', length: 50 },
        { name: 'password', type: 'varchar' },
        { name: 'role', type: 'enum' },
      ],
      habitaciones: [
        { name: 'id', type: 'int' },
        { name: 'numero', type: 'varchar' },
        { name: 'tipo', type: 'enum' },
        { name: 'estado', type: 'enum' },
      ],
      precios: [
        { name: 'id', type: 'int' },
        { name: 'tipo_habitacion', type: 'enum' },
        { name: 'mes', type: 'int' },
        { name: 'monto', type: 'decimal' },
      ],
      tipos_membresia: [
        { name: 'id_tipo_membresia', type: 'bigint' },
        { name: 'nombre', type: 'varchar' },
        { name: 'max_integrantes', type: 'int' },
        { name: 'precio', type: 'decimal' },
      ],
      metodos_pago: [
        { name: 'id_metodo_pago', type: 'bigint' },
        { name: 'nombre', type: 'varchar' },
      ],
    };

    async function getColumns(table) {
      const [rows] = await connection.query(
        `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?`,
        [config.mysql.database, table]
      );
      const map = new Map();
      for (const r of rows) {
        map.set(String(r.COLUMN_NAME).toLowerCase(), {
          type: String(r.DATA_TYPE).toLowerCase(),
          length: r.CHARACTER_MAXIMUM_LENGTH,
        });
      }
      return map;
    }

    for (const [table, cols] of Object.entries(expectedSchema)) {
      try {
        const colMap = await getColumns(table);
        for (const exp of cols) {
          const got = colMap.get(exp.name.toLowerCase());
          if (!got) {
            console.warn(`   - ${table}.${exp.name}: FALTA`);
            continue;
          }
          // Validación de tipo básico: coincide data_type (ignora atributos)
          const typeOk = got.type.includes(exp.type);
          // Validación de longitud si aplica
          const lenOk = exp.length ? (got.length == null || Number(got.length) >= Number(exp.length)) : true;
          const status = (typeOk && lenOk) ? 'OK' : `DIFIERE (got ${got.type}${got.length ? `(${got.length})` : ''})`;
          console.log(`   - ${table}.${exp.name}: ${status}`);
        }
      } catch (_) {
        console.warn(`   - No se pudo validar columnas de ${table}`);
      }
    }

    // Validación de ENGINE y COLLATION por tabla requerida
    console.log('\n⚙️  Validación de Engine/Collation:');
    const [tmeta] = await connection.query(
      `SELECT TABLE_NAME, ENGINE, TABLE_COLLATION FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME IN (${requiredTables.map(()=>'?' ).join(',')})`,
      [config.mysql.database, ...requiredTables]
    );
    const metaMap = new Map();
    for (const r of tmeta) metaMap.set(r.TABLE_NAME, { engine: r.ENGINE, collation: r.TABLE_COLLATION });
    const mismatchedEngines = [];
    const mismatchedCollations = [];
    for (const t of requiredTables) {
      const m = metaMap.get(t);
      if (!m) continue;
      const engOk = String(m.engine || '').toLowerCase() === 'innodb';
      const colOk = String(m.collation || '').toLowerCase().startsWith('utf8mb4');
      console.log(`   - ${t}: ENGINE=${m.engine || 'n/a'} ${engOk ? 'OK' : '(!)'} | COLLATION=${m.collation || 'n/a'} ${colOk ? 'OK' : '(!)'}`);
      if (!engOk) mismatchedEngines.push({ table: t, engine: m.engine });
      if (!colOk) mismatchedCollations.push({ table: t, collation: m.collation });
    }

    // Generar reporte JSON de salud de BD
    try {
      const countsReport = {};
      for (const t of quickCounts) {
        try {
          const [rows] = await connection.query(`SELECT COUNT(*) as c FROM \`${t}\``);
          countsReport[t] = rows[0]?.c ?? 0;
        } catch { countsReport[t] = null; }
      }
      const report = {
        timestamp: new Date().toISOString(),
        database: config.mysql.database,
        requiredTables: {
          total: requiredTables.length,
          present: requiredTables.length - missing.length,
          missing,
        },
        engines: { mismatched: mismatchedEngines },
        collations: { mismatched: mismatchedCollations },
        quickCounts: countsReport,
      };
      const outPath = path.join(__dirname, 'db_health_report.json');
      await fs.writeFile(outPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`\n📝 Reporte JSON generado: ${outPath}`);
    } catch (e) {
      console.warn('⚠️  No se pudo escribir el reporte JSON de salud de BD:', e.message);
    }

    // Resumen
    console.log(`✅ Sentencias ejecutadas: ${successCount}`);
    console.log(`⚠️  Sentencias omitidas: ${skippedCount}`);
    if (failedCount > 0) {
      console.log(`❗ Sentencias con error: ${failedCount}`);
      failures.slice(0, 5).forEach(f => {
        console.log(`   - #${f.index} ${f.code || ''}: ${f.msg}`);
      });
    }

    if (failedCount === 0) {
      console.log('🚀 ¡Base de datos y tablas creadas/actualizadas exitosamente!');
    } else {
      console.log('🚧 Proceso completado con advertencias. Revisa los mensajes anteriores.');
    }

  } catch (error) {
    console.error('❌ Error durante la configuración de la base de datos:', error.message);
  } finally {
    // 4. Cerrar la conexión
    await connection.end();
    console.log('🔌 Conexión cerrada.');
  }
}

setupDatabase();
