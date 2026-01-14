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
// ...existing exports...
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

/** --- NUEVAS FUNCIONES DE ENVÍO DE REPORTES --- **/
import emailService from "../../../services/emailService.js";
import whatsappService from "../../../services/whatsappService.js";
import {
  generateReportEmailBody,
  generateReportWhatsAppMessage,
  generateReportHTML,
  generateReportPDF
} from "../utils/reportUtils.js";

// Helper interno para obtener estadísticas (reutilizando lógica de renderReports)
async function getReportStats(periodo) {
  const allEntries = await getAllEntries();

  let totalCanchas = 0, totalAlberca = 0, totalGym = 0, totalGlobal = 0;
  allEntries.forEach(entry => {
    const cost = parseFloat(entry.cost) || 0;
    totalGlobal += cost;
    if (entry.area === 'Canchas') totalCanchas += cost;
    else if (entry.area === 'Alberca') totalAlberca += cost;
    else if (entry.area === 'Gimnasio') totalGym += cost;
  });

  return {
    totalGlobal: totalGlobal.toFixed(2),
    totalCanchas: totalCanchas.toFixed(2),
    totalAlberca: totalAlberca.toFixed(2),
    totalGym: totalGym.toFixed(2)
  };
}

export const sendReportEmail = async (req, res) => {
  try {
    const { periodo, destinatario, asunto } = req.body;

    // 1. Obtener datos
    const stats = await getReportStats(periodo);
    const fechaInicio = new Date().toLocaleDateString('es-MX');
    const fechaFin = new Date().toLocaleDateString('es-MX');

    // 2. Generar PDF
    const pdfHtml = generateReportHTML({ periodo, fechaInicio, fechaFin, stats });
    const pdfFileName = `Reporte_${periodo}_${Date.now()}.pdf`;
    const pdfPath = await generateReportPDF(pdfHtml, pdfFileName);

    // 3. Enviar con adjunto
    await emailService.sendEmailWithAttachment(
      destinatario,
      asunto || `Reporte ${periodo} de Ingresos`,
      `Adjunto encontrarás el reporte de ingresos para el periodo: ${periodo}.`,
      {
        filename: pdfFileName,
        path: pdfPath
      }
    );

    res.status(200).json({ message: "Correo enviado correctamente con PDF" });
  } catch (error) {
    console.error("Error enviando email:", error);
    res.status(500).json({ error: "Error al enviar el correo" });
  }
};

export const sendReportWhatsApp = async (req, res) => {
  try {
    const { periodo, telefono } = req.body;

    // 1. Obtener datos
    const stats = await getReportStats(periodo);
    const fechaInicio = new Date().toLocaleDateString('es-MX');
    const fechaFin = new Date().toLocaleDateString('es-MX');

    // 2. Generar PDF
    const pdfHtml = generateReportHTML({ periodo, fechaInicio, fechaFin, stats });
    const pdfFileName = `Reporte_${periodo}_${Date.now()}.pdf`;
    const pdfPath = await generateReportPDF(pdfHtml, pdfFileName);

    // 3. Generar Mensaje
    const message = generateReportWhatsAppMessage(periodo, fechaInicio, fechaFin, stats);

    // 4. Enviar usando el servicio
    if (!whatsappService.isConnected) {
      return res.status(400).json({ error: "WhatsApp no está conectado" });
    }

    const result = await whatsappService.enviarMensajeConPDF(
      telefono,
      message,
      pdfPath,
      pdfFileName
    );

    if (result.success) {
      res.status(200).json({ message: "WhatsApp enviado correctamente con PDF" });
    } else {
      res.status(500).json({ error: "Fallo al enviar WhatsApp: " + result.error });
    }

  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    res.status(500).json({ error: "Error al enviar el mensaje" });
  }
};
