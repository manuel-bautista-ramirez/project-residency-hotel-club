// roomsController.js
import {getHabitaciones, findReservacionById, crearRenta,  getAllReservationes, getAllRentas, deletebyReservation, updateRoomStatus, deleteByIdRenta, createReservation} from "../models/ModelRoom.js"; // Ajusta la ruta según tu proyecto



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
// change status
export const changesStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;  //  "disponible"
  const success = await updateRoomStatus(id, status);

  console.log("Status change result:", success);

  if (success) {
    res.redirect("/rooms");
  }
  else {
    res.status(500).send("No se pudo actualizar el estado.");
  }
};

// set numbers to works
function convertMumbersWorks(numero) {
  const unidades = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte"];
  if (numero >= 0 && numero <= 20) return unidades[numero];
  return numero.toString(); // Para números mayores, solo retorna el número como texto
}

// create new reservation by id Room
export const handleCreateReservation = async (req, res) => {
  try {
    // 1. Obtener el ID de la habitación desde la URL
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id)) {
      return res.status(400).send("ID de habitación inválido");
    }

    // 2. Obtener los datos del formulario
    const { nombre_cliente, correo, telefono, fecha_ingreso, fecha_salida, monto } = req.body;

    // 3. Obtener el ID numérico del usuario autenticado
    const usuario_id = req.session.user?.id;
    console.log("Usuario ID from session:", usuario_id);

    // Validar que el usuario esté autenticado y el ID sea numérico
    if (!usuario_id || Number.isNaN(Number(usuario_id))) {
      return res.status(401).send("Usuario no autenticado o ID inválido");
    }

    // 4. Convertir el monto a letras
    const monto_letras = convertMumbersWorks(Number(monto) || 0);

    // 5. Construir el objeto de datos de la reservación
    const reservationData = {
      habitacion_id,
      usuario_id: Number(usuario_id), // Asegura que sea numérico
      nombre_cliente,
      correo,
      telefono,
      fecha_ingreso,
      fecha_salida,
      monto: Number(monto) || 0,
      monto_letras
    };

    // 6. Crear la reservación en la base de datos
    const result = await createReservation(reservationData);

    // 7. Redireccionar o mostrar error
    if (result) {
      return res.redirect("/rooms");
    } else {
      return res.status(500).send("Error al crear la reservación...");
    }
  } catch (err) {
    console.error("Error handleCreateReservation:", err);
    return res.status(500).send("Error al crear la reservación...");
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

// delete by id reservation
export const deleteByIdResevation = async (req, res) => {
  try {
    const reservationId = Number(req.params.id);
    if (Number.isNaN(reservationId)) return res.status(400).send("ID inválido");

    const success = await deletebyReservation(reservationId);
  console.log("Delete reservation result:", success);

    if (success) {
      res.redirect("/rooms/list/reservations");
    } else {
      res.status(500).send("No se pudo eliminar la reservación");
    }
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).send("Error al eliminar la reservación");
  }
};

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
    console.error("Error al renderizar las rentas loco:", error.message);
    res.status(500).send("Error al cargar las rentas loco..");
  }
};


// delete by id renta
export const deleteIdRenta = async (req, res) => {
  try {
    const rentaId = Number(req.params.id);
    if (Number.isNaN(rentaId)) return res.status(400).send("ID inválido");

    const success = await deleteByIdRenta(rentaId);
    if (success) {
      res.redirect("/rentas/list"); // Ajusta la ruta según tu vista de rentas
    } else {
      res.status(500).send("No se pudo eliminar la renta");
    }
  } catch (err) {
    console.error("Error deleting renta:", err);
    res.status(500).send("Error al eliminar la renta");
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

export const createResevation = async (req, res) => {
  try {
    const habitacion_id = Number(req.params.id);
    if (Number.isNaN(habitacion_id)) return res.status(400).send("ID de habitación inválido");

    const habitaciones = await getHabitaciones();
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

    const habitaciones = await getHabitaciones();
    const habitacion = habitaciones.find(h => Number(h.id) === habitacion_id);
    if (!habitacion) return res.status(404).send("Habitación no encontrada");

    return res.render("rentar", {
      title: "Rentar habitación",
      showFooter: true,
      habitacion,
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

