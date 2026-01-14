import {
  getAllEntries,
  createEntry,
  deleteEntryById,
  updateEntryById,
  getDailyReport,
  getWeeklyReport,
  getBiweeklyReport,
  getMonthlyReport,
  getPrices,
  updatePrice
} from "../models/ModelDailyEntries.js";

/*** --- VISTAS --- ***/

export const renderMainPage = async (req, res) => {
  try {
    const rawPrices = await getPrices();
    // Convertimos los precios a enteros
    const prices = {
      price_canchas: Math.round(rawPrices.price_canchas),
      price_alberca: Math.round(rawPrices.price_alberca),
      price_gym: Math.round(rawPrices.price_gym)
    };

    res.render("entriesMain", {
      title: "Daily Entries",
      showFooter: true,
      showNavbar: true,
      user: req.session.user,
      prices: prices
    });
  } catch (err) {
    console.error("Error al cargar página principal:", err);
    res.status(500).send("Error al cargar los precios base");
  }
};

// --- FUNCIÓN MODIFICADA: ORDEN INVERSO E ID VISUAL ---
export const renderAllEntries = async (req, res) => {
  try {
    const entries = await getAllEntries(); // Viene de la DB (normalmente del más antiguo al más nuevo)

    // Total de registros para calcular el ID visual
    const total = entries.length;

    const formattedEntries = entries.map((entry, index) => {
      const d = new Date(entry.entry_date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strTime = `${hours}:${minutes} ${ampm}`;

      return {
        ...entry,
        // El ID visual será su posición real en la lista (1, 2, 3...)
        visual_id: index + 1,
        entry_date: `${day}/${month}/${year}, ${strTime}`
      };
    });

    // Invertimos al final para que el #10 (más nuevo) salga arriba del #1 (más antiguo)
    const finalEntries = formattedEntries.reverse();

    res.render("listEntries", {
      title: "Control de Registros",
      showFooter: true,
      showNavbar: true,
      entries: finalEntries,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error rendering entries:", err);
    res.status(500).send("Error loading entries");
  }
};

export const createNewEntry = async (req, res) => {
  try {
    const { first_name, last_name, area, cost, payment_method } = req.body;
    if (!first_name || !last_name || !area || !payment_method) {
      return res.status(400).send("Missing required fields");
    }

    const user_id = req.session.user?.id || 1;
    await createEntry({ first_name, last_name, area, cost, payment_method, user_id });
    return res.redirect("/entries/list");
  } catch (err) {
    console.error("Error creating entry:", err);
    return res.status(500).send("Error saving entry");
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { price_canchas, price_alberca, price_gym } = req.body;

    // Usamos Promise.all para ejecutar todas las actualizaciones en paralelo
    await Promise.all([
      updatePrice('price_canchas', price_canchas),
      updatePrice('price_alberca', price_alberca),
      updatePrice('price_gym', price_gym)
    ]);

    return res.status(200).json({ message: "Configuración actualizada correctamente" });
  } catch (err) {
    console.error("Error al actualizar precios base:", err);
    res.status(500).json({ error: "No se pudieron guardar los cambios" });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    await deleteEntryById(req.params.id);
    return res.redirect("/entries/list");
  } catch (err) {
    console.error("Error deleting entry:", err);
    return res.status(500).send("Error deleting entry");
  }
};

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

export const renderReports = async (req, res) => {
  try {
    // Obtenemos todos los datos brutos de la DB
    const daily = await getDailyReport();
    const weekly = await getWeeklyReport();
    const biweekly = await getBiweeklyReport();
    const monthly = await getMonthlyReport();
    const allEntries = await getAllEntries();

    // CORRECCIÓN CLAVE: Mapeo de fechas diarias
    const formattedDaily = daily.map(item => {
      // Si el item.date viene como objeto Date de la DB, lo tratamos con cuidado
      const d = new Date(item.date);

      // Si la fecha detectada es mañana (día 12) pero aún estamos a día 11 en México,
      // la lógica de getUTCDate() que pusimos antes puede no ser suficiente si la DB
      // ya agrupó los datos como '2026-01-12'.

      // Para mostrarlo correctamente basado en la cadena de texto de la DB:
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const [year, month, day] = dateString.split('-');

      return {
        ...item,
        date: `${day}/${month}/${year}`
      };
    });

    // ... (Mantén el resto de la lógica de meses y estadísticas igual)
    const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const formattedMonthly = monthly.map(item => ({
      ...item,
      monthName: meses[parseInt(item.month)] || item.month
    }));

    let totalCanchas = 0, totalAlberca = 0, totalGym = 0, totalGlobal = 0;

    allEntries.forEach(entry => {
      const cost = parseFloat(entry.cost) || 0;
      totalGlobal += cost;
      if (entry.area === 'Canchas') totalCanchas += cost;
      else if (entry.area === 'Alberca') totalAlberca += cost;
      else if (entry.area === 'Gimnasio') totalGym += cost;
    });

    const areaStats = { "Canchas": totalCanchas, "Alberca": totalAlberca, "Gimnasio": totalGym };
    const topArea = Object.keys(areaStats).reduce((a, b) => areaStats[a] > areaStats[b] ? a : b, "Ninguna");

    return res.render("reportEntries", {
      showNavbar: true,
      showFooter: true,
      title: "Reporte de Ingresos Oficial",
      reports: { daily: formattedDaily, weekly, biweekly, monthly: formattedMonthly },
      stats: {
        topArea,
        totalGlobal: totalGlobal.toFixed(2),
        totalCanchas: totalCanchas.toFixed(2),
        totalAlberca: totalAlberca.toFixed(2),
        totalGym: totalGym.toFixed(2)
      },
      user: req.session.user

    });
  } catch (err) {
    console.error("Error en reporte:", err);
    res.status(500).send("Error al generar reportes");
  }
};
// Asegúrate de que esta función esté presente al final de dailyEntriesController.js
export const bulkDeleteEntries = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No se seleccionaron IDs" });
    }
    const promises = ids.map(id => deleteEntryById(id));
    await Promise.all(promises);
    return res.status(200).json({ message: "Registros eliminados con éxito" });
  } catch (err) {
    console.error("Error en eliminación masiva:", err);
    return res.status(500).json({ error: "Error interno al eliminar" });
  }
};
