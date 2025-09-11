// roomsController.js
import {getHabitaciones, findReservacionById, crearRenta,  getAllReservationes, getAllRentas} from "../models/ModelRoom.js"; // Ajusta la ruta según tu proyecto



/*** --- VISTAS PRINCIPALES --- ***/

export const renderHabitacionesView = async (req, res) => {
  try {
    const  user = req.session.user || {role: "Usuario"}
    const habitaciones = await getHabitaciones();

    res.render("habitaciones", {
      title: "Habitaciones",
      showFooter: true,
      habitaciones,
      user: {
        ...user,
        rol: user.role
      }
    });
  } catch (err) {
    console.error("Error al renderizar habitaciones:", err);
    res.status(500).send("Error al cargar las habitaciones");
  }
};

// get all Reservaciones
export const renderAllRervationes =async(req, res)=>{
  try {
    const  user = req.session.user || {role: "Usuario"}
    const allReservationes =await getAllReservationes();


    res.render("mostarReservaciones", {
      title: "Adminstracion de  Reservaciones",
      allReservationes,
      user: {
        ...user,
        rol: user.role
      }
    });
  } catch (error) {
    console.error("Error al renderrizar las reservaciones");
    res.status(500).send("Errror al cargar las reservaciones loco..")

  }

}


export const renderAllRentas = async (req, res) => {
  try {
  const  user = req.session.user || {role: "Administrador" }
  const allRentas = await getAllRentas();
  console.log(allRentas)
  res.render('mostrarRentas', {
    title: 'Listado de habitaciones rentadas',
    allRentas,
    showFooter: true,
    user: {
        ...user,
        rol: user.role
      }
   });
  } catch (error) {
    console.error("Error al renderrizar las rentas loco");
    res.status(500).send("Errror al cargar las rentas loco..")

  }
};


export const renderFormEditarReservacion = async (req, res) => {
  try {
    const reservacionId = Number(req.params.id);
    if (Number.isNaN(reservacionId)) return res.status(400).send("ID de reservación inválido");

    const reservacion = await findReservacionById(reservacionId);
    if (!reservacion) return res.status(404).send("Reservación no encontrada");

    // Formatear fechas para inputs tipo date
    reservacion.fecha_ingreso = reservacion.fecha_ingreso.toISOString().split('T')[0];
    reservacion.fecha_salida  = reservacion.fecha_salida.toISOString().split('T')[0];

    const habitaciones = await getHabitaciones();

    return res.render("editarReservacion", {
      title: "Editar Reservación",
      showFooter: true,
      reservacion,
      habitaciones,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error en renderFormEditarReservacion:", err);
    return res.status(500).send("Error al cargar el formulario de edición de reservación");
  }
};
// Implementacion de midleware error500, exitosamente sulado
export const renderPreciosView = async (req, res, next) => {
  try {
    // FORZAMOS UN ERROR MANUALMENTE para probar el middleware
    throw new Error("Error interno simulado para prueba del middleware 500");

    // Código normal (se puede comentar mientras pruebas)
    // const precios = await Room.precios();
    // res.render("precios", {
    //   title: "Precios de Habitaciones",
    //   showFooter: true,
    //   precios
    // });
  } catch (err) {
    console.error("Error al renderizar precios:", err);

    // Llamamos al middleware de error 500
    next(err);
  }
};


export const renderReservacionesView = async (req, res) => {
  const  user = req.session.user || {role: "Administrador" }
  try {
    res.render("reportes", {
      title: "reportes",
      showFooter: true,
      user: {
        ...user,
        rol: user.role
      }
    });
  } catch (err) {
    console.error("Error al renderizar reportes de rentas:", err);
    return res.status(500).send("Error al cargar los reportes de rentas");
  }
};


/*** --- FORMULARIOS INDIVIDUALES --- ***/

export const renderFormReservar = async (req, res) => {
  try {
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id)) return res.status(400).send("ID de habitación inválido");

    const habitaciones = await Room.find();
    const habitacion = habitaciones.find(h => Number(h.id) === habitacion_id);
    if (!habitacion) return res.status(404).send("Habitación no encontrada");

    return res.render("reservar", {
      title: "Reservar habitación",
      habitacion,
      habitaciones,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error en renderFormReservar:", err);
    return res.status(500).send("Error al cargar el formulario de reservación");
  }
};

export const renderFormRentar = async (req, res) => {
  try {
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id)) return res.status(400).send("ID de habitación inválido");

    const habitaciones = await crearRenta();
    const habitacion = habitaciones.find(h => Number(h.id) === habitacion_id);
    if (!habitacion) return res.status(404).send("Habitación no encontrada");

    return res.render("rentar", {
      title: "Rentar habitación",
      showFooter: true,
      habitacion,
      habitaciones,
      monto: montoCalculado,
      monto_letras: montoEnLetras,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error en renderFormRentar:", err);
    return res.status(500).send("Error al cargar el formulario de renta");
  }
};



export const renderCalendario = (req, res) => {
  res.render('calendario', {
    title: 'Calendario de Habitaciones',
    showFooter: true
   });
};

export const fetchEventos = async (req, res) => {
  try {
    const eventos = await getEventosCalendario();
    res.json(eventos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
};
