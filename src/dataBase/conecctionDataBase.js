// Importación de las librerías necesarias
import mysql from "mysql2/promise"; // Importa las funciones necesarias de mysql2 para manejar la base de datos de forma asíncrona.
import dotenv from "dotenv"; // Importa dotenv para cargar variables de entorno desde un archivo .env.


dotenv.config(); // Carga las variables de entorno desde el archivo .env al iniciar la aplicación.

// Crear un pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",        // Host de la base de datos
  user: process.env.DB_USER || "",           // Usuario para conectar a la base de datos
  password: process.env.DB_PASSWORD || "", // Contraseña para conectar a la base de datos
  database: process.env.DB_NAME || "",   // Nombre de la base de datos
  waitForConnections: true,                        // Esperar conexiones disponibles
  connectionLimit: 10,                             // Límite de conexiones simultáneas
  queueLimit: 0,                                   // Límite de solicitudes en cola
});

// Clase para manejar consultas usando el pool
class Database {
  // Método para ejecutar una consulta SQL
  async query(sql, params = []) {
    let connection = null; // Variable para almacenar la conexión temporal
    try {
      // Establecer la conexión desde el pool
      connection = await pool.getConnection();
      console.log("✅ Database connection established"); // Mensaje indicando que la conexión fue establecida

      // Ejecutar la consulta
      const [results] = await connection.execute(sql, params);
      return results; // Retornar los resultados de la consulta
    } catch (error) {
      console.error("❌ Error en la consulta a la base de datos:", error);
      throw error; // Lanzar el error para manejarlo en el modelo o controlador
    } finally {
      // Liberar la conexión de vuelta al pool
      if (connection) {
        connection.release();
        console.log("🔌 Database connection released"); // Mensaje indicando que la conexión fue liberada
      }
    }
  }
}

// Exportar la instancia de la clase Database
const database = new Database();
export default database;
