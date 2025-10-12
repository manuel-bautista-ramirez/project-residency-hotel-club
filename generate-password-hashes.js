import bcrypt from 'bcrypt';

const passwords = [
  { username: 'manuel', password: 'manuel123', role: 'Administrador' },
  { username: 'daniela', password: 'daniela123', role: 'Usuario' }
];

async function generateHashes() {
  console.log('\n=== GENERANDO HASHES BCRYPT ===\n');

  const hashes = [];
  for (const user of passwords) {
    const hash = await bcrypt.hash(user.password, 10);
    hashes.push({ ...user, hash });
    console.log(`-- ${user.role}: ${user.username} / ${user.password}`);
    console.log(`Hash: ${hash}`);
    console.log('');
  }

  console.log('=== SCRIPT SQL COMPLETO ===\n');
  console.log('INSERT IGNORE INTO users_hotel (username, password, role) VALUES');
  for (let i = 0; i < hashes.length; i++) {
    const user = hashes[i];
    const comma = i < hashes.length - 1 ? ',' : ';';
    console.log(`  ('${user.username}', '${user.hash}', '${user.role}')${comma}`);
  }
}

generateHashes().catch(console.error);
