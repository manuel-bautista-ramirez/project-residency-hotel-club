import express from 'express';
import {getHabitaciones, setEstadoHabitacion} from '../controllers/roomsController.js';

const routerRoom = express.Router();

// Mostrar habitaciones
routerRoom.get('/', (req, res) => {
  const habitaciones = controller.getHabitaciones();
  res.render('habitaciones', { habitaciones });
});

// Cambiar estado de habitación
routerRoom.post('/estado/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { estado } = req.body;
  controller.setEstadoHabitacion(id, estado);
  res.redirect('/habitaciones');
});

export { routerRoom };
