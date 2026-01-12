// ModelDailyEntries.js
import { pool } from "../../../dataBase/connectionDataBase.js";

//Stashed changes
/*** --- CRUD FUNCTIONS --- ***/

// Get all entries
export const getAllEntries = async () => {
  const [rows] = await pool.query("SELECT * FROM daily_entries ORDER BY entry_date DESC");
  return rows;
};

// Create entry (now with payment_method)
// ModelDailyEntries.js
export const createEntry = async ({ first_name, last_name, area, cost, payment_method, user_id }) => {
  // Generamos la fecha actual en formato ISO compatible con MySQL
  // Esto asegura que se guarde la hora exacta de tu sistema
  const entry_date = new Date(); 
  
  const query = `INSERT INTO daily_entries (first_name, last_name, area, cost, payment_method, user_id, entry_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  await pool.query(query, [first_name, last_name, area, cost, payment_method, user_id, entry_date]);
};

// Delete entry
export const deleteEntryById = async (id) => {
  await pool.query("DELETE FROM daily_entries WHERE id = ?", [id]);
};

// Update entry
export const updateEntryById = async (id, { first_name, last_name }) => {
  await pool.query("UPDATE daily_entries SET first_name = ?, last_name = ? WHERE id = ?", [first_name, last_name, id]);
};

/*** --- REPORTS --- ***/

/*** --- REPORTS (CORREGIDOS PARA ZONA HORARIA MÉXICO -6) --- ***/

// Daily - Ajustado para que el día termine a las 12:00 AM de México
export const getDailyReport = async () => {
  const [rows] = await pool.query(`
    SELECT DATE(DATE_SUB(entry_date, INTERVAL 6 HOUR)) AS date, SUM(cost) AS total
    FROM daily_entries
    GROUP BY date
    ORDER BY date DESC
  `);
  return rows;
};

// Weekly - Ajustado para que la semana se calcule con hora local
export const getWeeklyReport = async () => {
  const [rows] = await pool.query(`
    SELECT YEAR(DATE_SUB(entry_date, INTERVAL 6 HOUR)) AS year, 
           WEEK(DATE_SUB(entry_date, INTERVAL 6 HOUR), 1) AS week, 
           SUM(cost) AS total
    FROM daily_entries
    GROUP BY year, week
    ORDER BY year DESC, week DESC
  `);
  return rows;
};

// Biweekly - Ajustado para que el salto de quincena sea a medianoche local
export const getBiweeklyReport = async () => {
  const [rows] = await pool.query(`
    SELECT YEAR(DATE_SUB(entry_date, INTERVAL 6 HOUR)) AS year, 
           MONTH(DATE_SUB(entry_date, INTERVAL 6 HOUR)) AS month,
           FLOOR((DAY(DATE_SUB(entry_date, INTERVAL 6 HOUR))-1)/15)+1 AS biweek,
           SUM(cost) AS total
    FROM daily_entries
    GROUP BY year, month, biweek
    ORDER BY year DESC, month DESC, biweek DESC
  `);
  return rows;
};

// Monthly - Ajustado para que el cierre de mes sea a medianoche local
export const getMonthlyReport = async () => {
  const [rows] = await pool.query(`
    SELECT YEAR(DATE_SUB(entry_date, INTERVAL 6 HOUR)) AS year, 
           MONTH(DATE_SUB(entry_date, INTERVAL 6 HOUR)) AS month, 
           SUM(cost) AS total
    FROM daily_entries
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `);
  return rows;
};
// Estas funciones faltan en tu archivo de Modelos y por eso sale el error
export const getPrices = async () => {
  const [rows] = await pool.query("SELECT * FROM settings");
  // Convierte el array en un objeto: { price_canchas: 60, ... }
  return rows.reduce((acc, row) => {
    acc[row.setting_key] = row.setting_value;
    return acc;
  }, {});
};

export const updatePrice = async (key, value) => {
  await pool.query("UPDATE settings SET setting_value = ? WHERE setting_key = ?", [value, key]);
};