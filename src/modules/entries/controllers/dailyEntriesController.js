// dailyEntriesController.js
import {
  getAllEntries,
  createEntry,
  deleteEntryById,
  updateEntryById,
  getDailyReport,
  getWeeklyReport,
  getBiweeklyReport,
  getMonthlyReport
} from "../models/ModelDailyEntries.js";

/*** --- VISTAS --- ***/

// Main page (cards + modal)
export const renderMainPage = (req, res) => {
  res.render("entriesMain", {
    title: "Daily Entries",
    showFooter: true,
    user: req.session.user
  });
};

// Render list
export const renderAllEntries = async (req, res) => {
  try {
    const entries = await getAllEntries();
    res.render("listEntries", {
      title: "Daily Entries",
      showFooter: true,
      entries,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error rendering entries:", err);
    res.status(500).send("Error loading entries");
  }
};

// Create new entry
export const createNewEntry = async (req, res) => {
  try {
    const { first_name, last_name, area, payment_method } = req.body;

    if (!first_name || !last_name || !area || !payment_method) {
      return res.status(400).send("Missing required fields");
    }

    // Cost by area (source of truth server-side)
    let cost = 0;
    if (area === "Courts") cost = 60;
    if (area === "Pool") cost = 100;
    if (area === "Gym") cost = 40;

    // session user id (use fallback if you still need it)
    const user_id = req.session.user?.id || 1;

    await createEntry({ first_name, last_name, area, cost, payment_method, user_id });

    return res.redirect("/entries/list");
  } catch (err) {
    console.error("Error creating entry:", err);
    return res.status(500).send("Error saving entry");
  }
};

// Delete entry (admin)
export const deleteEntry = async (req, res) => {
  try {
    await deleteEntryById(req.params.id);
    return res.redirect("/entries/list");
  } catch (err) {
    console.error("Error deleting entry:", err);
    return res.status(500).send("Error deleting entry");
  }
};

// Update entry (admin)
export const updateEntry = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    await updateEntryById(req.params.id, { first_name, last_name });
    return res.redirect("/entries/list");
  } catch (err) {
    console.error("Error updating entry:", err);
    return res.status(500).send("Error updating entry");
  }
};

// Reports (admin only — route protected)
export const renderReports = async (req, res) => {
  try {
    const daily = await getDailyReport();
    const weekly = await getWeeklyReport();
    const biweekly = await getBiweeklyReport();
    const monthly = await getMonthlyReport();

    return res.render("reportEntries", {
      title: "Income Reports",
      showFooter: true,
      reports: { daily, weekly, biweekly, monthly },
      user: req.session.user
    });
  } catch (err) {
    console.error("Error generating reports:", err);
    return res.status(500).send("Error loading reports");
  }
};




