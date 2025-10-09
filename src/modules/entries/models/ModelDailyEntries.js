// ModelDailyEntries.js
import { pool } from "../../../dataBase/conecctionDataBase.js";

/*** --- CRUD FUNCTIONS --- ***/

// Get all entries
export const getAllEntries = async () => {
  const [rows] = await pool.query("SELECT * FROM daily_entries ORDER BY entry_date DESC");
  return rows;
};

// Create entry (now with payment_method)
export const createEntry = async ({ first_name, last_name, area, cost, payment_method, user_id }) => {
  const query = `INSERT INTO daily_entries (first_name, last_name, area, cost, payment_method, user_id) VALUES (?, ?, ?, ?, ?, ?)`;
  await pool.query(query, [first_name, last_name, area, cost, payment_method, user_id]);
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

// Daily
export const getDailyReport = async () => {
  const [rows] = await pool.query(`
    SELECT DATE(entry_date) AS date, SUM(cost) AS total
    FROM daily_entries
    GROUP BY DATE(entry_date)
    ORDER BY DATE(entry_date) DESC
  `);
  return rows;
};

// Weekly
export const getWeeklyReport = async () => {
  const [rows] = await pool.query(`
    SELECT YEAR(entry_date) AS year, WEEK(entry_date, 1) AS week, SUM(cost) AS total
    FROM daily_entries
    GROUP BY YEAR(entry_date), WEEK(entry_date, 1)
    ORDER BY year DESC, week DESC
  `);
  return rows;
};

// Biweekly
export const getBiweeklyReport = async () => {
  const [rows] = await pool.query(`
    SELECT YEAR(entry_date) AS year, MONTH(entry_date) AS month,
           FLOOR((DAY(entry_date)-1)/15)+1 AS biweek,
           SUM(cost) AS total
    FROM daily_entries
    GROUP BY YEAR(entry_date), MONTH(entry_date), biweek
    ORDER BY year DESC, month DESC, biweek DESC
  `);
  return rows;
};

// Monthly
export const getMonthlyReport = async () => {
  const [rows] = await pool.query(`
    SELECT YEAR(entry_date) AS year, MONTH(entry_date) AS month, SUM(cost) AS total
    FROM daily_entries
    GROUP BY YEAR(entry_date), MONTH(entry_date)
    ORDER BY year DESC, month DESC
  `);
  return rows;
};

