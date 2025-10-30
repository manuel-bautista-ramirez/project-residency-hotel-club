import mysql2 from "mysql2/promise";
import {config} from "../config/configuration.js";

// Crear el pool de conexiones
export const pool = mysql2.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z' // Usar UTC para evitar conversiones automáticas de zona horaria
});

// Función para probar la conexión con la base de datos.
async function connectDB() {
  try {
    const connection = await pool.getConnection();
    if (connection){
      console.log("Connected to Db: YES", );
    }else{
      console.log("Connected to DB: NOT")
    }


    // Probar si la base de datos existe
    await connection.query('USE ??', config.mysql.database || ' ');
    console.log(`Using database: ${config.mysql.database}`);

    connection.release(); // Liberar la conexión una vez que se haya probado
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error("Database does not exist:", error.message);
    } else if (error.code === 'ER_NO_DB_ERROR') {
      console.error("No database selected:", error.message);
    } else {
      console.error("Error connecting to Db:", error);
    }
    setTimeout(connectDB, 2000); // Reintentar la conexión en caso de error
  }

  // Manejo de errores en caso de que la conexión se pierda
  pool.on("error", (error) => {
    console.error("DB error:", error);
    if (error.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("Reconnecting to the database...");
      connectDB(); // Reintentar la conexión en caso de pérdida de conexión
    } else {
      throw error; // Lanza otros errores si son distintos
    }
  });
}

// Función helper para ejecutar queries
export async function executeQuery(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
}

// Llamar a la función para iniciar la conexión
connectDB();
