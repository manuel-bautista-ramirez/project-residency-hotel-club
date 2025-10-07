import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/configuration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function dbHealth() {
  const connection = await mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    multipleStatements: true,
  });

  console.log('✅ Conectado al servidor de MySQL.');

  try {
    // Tablas requeridas
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

    // Conteos rápidos
    const quickCounts = ['metodos_pago','tipos_membresia','habitaciones'];
    const countsReport = {};
    for (const t of quickCounts) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as c FROM \`${t}\``);
        const c = rows[0]?.c ?? 0;
        countsReport[t] = c;
        console.log(`   - ${t}: ${c} registros`);
      } catch {
        countsReport[t] = null;
        console.warn(`   - ${t}: no disponible`);
      }
    }

    // Validación de índices
    async function hasIndex(table, indexName) {
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?`,
          [config.mysql.database, table, indexName]
        );
        return (rows[0]?.c ?? 0) > 0;
      } catch { return false; }
    }

    const checks = [
      { type: 'index', table: 'tipos_membresia', name: 'nombre', desc: 'UNIQUE(nombre) en tipos_membresia' },
      { type: 'index', table: 'users_hotel', name: 'username', desc: 'UNIQUE(username) en users_hotel' },
    ];
    console.log('\n🧪 Validación de índices clave:');
    const indexReport = [];
    for (const chk of checks) {
      const ok = await hasIndex(chk.table, chk.name);
      console.log(`   - ${chk.desc}: ${ok ? 'OK' : 'FALTA'}`);
      indexReport.push({ table: chk.table, index: chk.name, ok });
    }

    // Validación de FKs por columna
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
    console.log('\n🔗 Validación de llaves foráneas:');
    const fkReport = [];
    for (const fk of fkCols) {
      const ok = await fkExistsByColumn(fk.table, fk.column);
      console.log(`   - FK ${fk.table}.${fk.column}: ${ok ? 'OK' : 'FALTA'}`);
      fkReport.push({ table: fk.table, column: fk.column, ok });
    }

    // Validación de columnas y tipos básicos
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

    const columnReport = [];
    for (const [table, cols] of Object.entries(expectedSchema)) {
      try {
        const colMap = await getColumns(table);
        for (const exp of cols) {
          const got = colMap.get(exp.name.toLowerCase());
          if (!got) {
            console.warn(`   - ${table}.${exp.name}: FALTA`);
            columnReport.push({ table, column: exp.name, status: 'MISSING' });
            continue;
          }
          const typeOk = got.type.includes(exp.type);
          const lenOk = exp.length ? (got.length == null || Number(got.length) >= Number(exp.length)) : true;
          const ok = typeOk && lenOk;
          console.log(`   - ${table}.${exp.name}: ${ok ? 'OK' : `DIFIERE (got ${got.type}${got.length ? `(${got.length})` : ''})`}`);
          columnReport.push({ table, column: exp.name, ok, got });
        }
      } catch {
        console.warn(`   - No se pudo validar columnas de ${table}`);
      }
    }

    // Engine/Collation
    console.log('\n⚙️  Validación de Engine/Collation:');
    const [tmeta] = await connection.query(
      `SELECT TABLE_NAME, ENGINE, TABLE_COLLATION FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME IN (${requiredTables.map(()=>'?').join(',')})`,
      [config.mysql.database, ...requiredTables]
    );
    const metaMap = new Map();
    for (const r of tmeta) metaMap.set(r.TABLE_NAME, { engine: r.ENGINE, collation: r.TABLE_COLLATION });
    const mismatchedEngines = [];
    const mismatchedCollations = [];
    const engineReport = [];
    for (const t of requiredTables) {
      const m = metaMap.get(t);
      if (!m) continue;
      const engOk = String(m.engine || '').toLowerCase() === 'innodb';
      const colOk = String(m.collation || '').toLowerCase().startsWith('utf8mb4');
      console.log(`   - ${t}: ENGINE=${m.engine || 'n/a'} ${engOk ? 'OK' : '(!)'} | COLLATION=${m.collation || 'n/a'} ${colOk ? 'OK' : '(!)'}`);
      if (!engOk) mismatchedEngines.push({ table: t, engine: m.engine });
      if (!colOk) mismatchedCollations.push({ table: t, collation: m.collation });
      engineReport.push({ table: t, engine: m.engine, collation: m.collation, engOk, colOk });
    }

    // Reporte JSON
    const report = {
      timestamp: new Date().toISOString(),
      database: config.mysql.database,
      requiredTables: {
        total: requiredTables.length,
        present: requiredTables.length - missing.length,
        missing,
      },
      quickCounts: countsReport,
      indexes: indexReport,
      foreignKeys: fkReport,
      columns: columnReport,
      engines: engineReport,
    };
    const outPath = path.join(__dirname, 'db_health_report.json');
    await fs.writeFile(outPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n📝 Reporte JSON generado: ${outPath}`);

    // Strict mode: fail CI if any critical check fails
    const STRICT = String(process.env.HEALTH_STRICT || 'false').toLowerCase() === 'true';
    const hasMissingTables = missing.length > 0;
    const badIndexes = indexReport.filter(i => !i.ok).length;
    const badFks = fkReport.filter(f => !f.ok).length;
    const badColumns = columnReport.filter(c => c.status === 'MISSING' || c.ok === false).length;
    const badEngines = engineReport.filter(e => !e.engOk || !e.colOk).length;

    const totalIssues = (hasMissingTables ? 1 : 0) + badIndexes + badFks + badColumns + badEngines;

    if (STRICT && totalIssues > 0) {
      console.error(`\n❌ HEALTH_STRICT activado. Se encontraron problemas: ` +
        `tablas faltantes=${hasMissingTables ? missing.length : 0}, ` +
        `indices=${badIndexes}, fks=${badFks}, columnas=${badColumns}, engine/collation=${badEngines}`);
      process.exitCode = 2;
    } else {
      console.log('\n✅ Verificación de salud de BD completada.');
    }
  } catch (err) {
    console.error('❌ Error durante la verificación de salud:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
    console.log('🔌 Conexión cerrada.');
  }
}

// Run
dbHealth();
