import { addUser, findUserByUsername } from '../models/userModel.js';
import { pool } from '../../../dataBase/connectionDataBase.js';

/*
  Seed de usuarios de prueba (desarrollo)
  - Crea un usuario Administrador y un Usuario normal si no existen.
  - Idempotente: no duplica si ya existen.
  - Soporta variables de entorno para credenciales.

  Env opcionales:
    ADMIN_USER, ADMIN_PASS, ADMIN_ROLE (Administrador|Usuario)
    USER2_USER, USER2_PASS, USER2_ROLE  (Administrador|Usuario)
*/

async function run() {
  // Si la tabla ya tiene usuarios, no hacer nada
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS c FROM users_hotel');
    const count = rows?.[0]?.c ?? 0;
    if (count > 0) {
      console.log(`ℹ️  La tabla users_hotel ya tiene ${count} usuario(s). Seed omitido.`);
      // Aún permitimos modo verificación por usuario abajo
    }
  } catch (e) {
    console.warn('⚠️  No se pudo verificar el conteo de usuarios. Continuando con precaución:', e.message);
  }
  const ADMIN_USER = process.env.ADMIN_USER || 'manuel';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'manuel123';
  const ADMIN_ROLE = (process.env.ADMIN_ROLE || 'Administrador').trim();

  const USER2_USER = process.env.USER2_USER || 'daniela';
  const USER2_PASS = process.env.USER2_PASS || 'daniela123';
  const USER2_ROLE = (process.env.USER2_ROLE || 'Usuario').trim();

  const validRoles = new Set(['Administrador', 'Usuario']);
  const roleOrDefault = (r, def) => (validRoles.has(r) ? r : def);

  const users = [
    { username: ADMIN_USER, password: ADMIN_PASS, role: roleOrDefault(ADMIN_ROLE, 'Administrador') },
    { username: USER2_USER, password: USER2_PASS, role: roleOrDefault(USER2_ROLE, 'Usuario') },
  ];

  // Modo verificación por defecto: no crea, solo informa estado, a menos que SEED_USERS=true
  const ALLOW_CREATE = String(process.env.SEED_USERS || 'false').toLowerCase() === 'true';
  if (!ALLOW_CREATE) {
    console.log('🔎 Modo verificación (SEED_USERS!=true). No se crearán usuarios.');
    for (const u of users) {
      try {
        const exists = await findUserByUsername(u.username);
        console.log(`   - ${u.username}: ${exists ? 'EXISTE' : 'NO EXISTE'}`);
      } catch (err) {
        console.warn(`   - ${u.username}: error al verificar -> ${err.message}`);
      }
    }
    console.log('✅ Verificación completada. Para crear, ejecute con SEED_USERS=true.');
    return;
  }

  let created = 0;
  for (const u of users) {
    try {
      const exists = await findUserByUsername(u.username);
      if (exists) {
        console.log(`⚠️  Usuario '${u.username}' ya existe. Omitiendo.`);
        continue;
      }
      await addUser(u.username, u.password, u.role);
      console.log(`✅ Usuario '${u.username}' creado (${u.role}).`);
      created++;
    } catch (err) {
      console.error(`❌ Error creando usuario '${u.username}':`, err.message);
    }
  }

  if (created === 0) {
    console.log('ℹ️  No se crearon usuarios nuevos (ya existían).');
  } else {
    console.log(`🚀 Seed completado. Usuarios creados: ${created}.`);
  }
}

run();
