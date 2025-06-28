import bcrypt from 'bcrypt';
import database from '../../../dataBase/conecctionDataBase.js'; // Importar la instancia de la base de datos

// Función para agregar un nuevo usuario con contraseña cifrada
export const addUser = async (username, password, role) => {
  const hashedPassword = await bcrypt.hash(password, 10); // Cifrar la contraseña
  const query = 'INSERT INTO users_hotel (username, password, role) VALUES (?, ?, ?)';
  await database.query(query, [username, hashedPassword, role]); // Usar el método query
  console.log(`Usuario ${username} agregado con contraseña cifrada.`);
};

// Buscar usuario por nombre de usuario
export const findUserByUsername = async (username) => {
  const query = 'SELECT * FROM users_hotel WHERE username = ?';
  const results = await database.query(query, [username]);
  if (!results || results.length === 0) {
    return null;
  }
  return results[0];
};

// Función para verificar la contraseña
export const verifyPassword = async (inputPassword, storedPassword) => {
  if (!inputPassword || !storedPassword) {
    console.error('❌ Error: Contraseña ingresada o almacenada es inválida.');
    return false;
  }
  return await bcrypt.compare(inputPassword, storedPassword);
};

// Función para actualizar la contraseña del usuario
export const updateUserPassword = async (userId, hashedPassword) => {
  const query = 'UPDATE users_hotel SET password = ? WHERE id = ?';
  await database.query(query, [hashedPassword, userId]);
};

// Función para agregar usuarios iniciales si no existen
const seedUsers = async () => {
  try {
    const users = [
      { username: 'manuel', password: 'manuel123', role: 'SuperUsuario' },
      { username: 'adminn', password: 'admin123', role: 'Administrador' },
      { username: 'userrs', password: 'user1234', role: 'UsuarioNormal' },
    ];

    for (const user of users) {
      const existingUser = await findUserByUsername(user.username);
      if (!existingUser) {
        await addUser(user.username, user.password, user.role);
        console.log(`Usuario ${user.username} agregado correctamente con contraseña cifrada.`);
      } else {
        console.log(`Usuario ${user.username} ya existe. No se agregó nuevamente.`);
      }
    }
  } catch (error) {
    console.error('Error al agregar usuarios:', error);
  }
};


// Ejecutar la función para agregar usuarios iniciales
//seedUsers();
