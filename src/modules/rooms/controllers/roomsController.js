import Room, { memberships } from '../models/ModelRoom.js';

// Obtener todas las habitaciones
export async function getHabitaciones() {
  return await Room.find();
}

// Obtener todos los precios
export async function getPrecios() {
  return await Room.precios();
}

// Obtener todas las reservaciones
export async function getReservaciones() {
  return await Room.reservaciones();
}

// Obtener todas las rentas
export async function getRentas() {
  return await Room.rentas();
}

// Cambiar estado de una habitación (simulado, ya que Room.find es solo lectura)
export async function setEstadoHabitacion(id, nuevoEstado) {
  const habitaciones = await Room.find();
  const hab = habitaciones.find(h => h.id === id);
  if (hab) hab.estado = nuevoEstado;
  return hab;
}

export function showAvailableMemberships() {
  console.log('Membresías disponibles:');
  memberships.forEach(m => {
    console.log(`ID: ${m.id} | Nombre: ${m.name} | Precio: $${m.price}`);
  });
}

// Mostrar datos generales de habitaciones
export async function showHabitacionesGeneral() {
  const habitaciones = await Room.find();
  console.log('Datos Generales de Habitaciones:');
  habitaciones.forEach(h => {
    console.log(`Número: ${h.numero} | Tipo: ${h.tipo} | Estado: ${h.estado}`);
  });
}

// Mostrar precios por mes y tipo de habitación
export async function showPreciosPorMes() {
  const precios = await Room.precios();
  console.log('Precios por mes y tipo de habitación:');
  precios.forEach(p => {
    console.log(`Mes: ${p.mes} | Tipo: ${p.tipo_habitacion} | Monto: $${p.monto}`);
  });
}

// Mostrar reservaciones con datos principales
export async function showReservaciones() {
  const reservaciones = await Room.reservaciones();
  console.log('Reservaciones:');
  reservaciones.forEach(r => {
    console.log(
      `Cliente: ${r.nombre_cliente} | Habitación: ${r.habitacion_id} | Fecha Reserva: ${r.fecha_reserva} | Fecha Ingreso: ${r.fecha_ingreso} | Fecha Salida: ${r.fecha_salida} | Monto: $${r.monto} | Monto en letras: ${r.monto_letras}`
    );
  });
}

// Mostrar rentas con datos principales
export async function showRentas() {
  const rentas = await Room.rentas();
  console.log('Rentas:');
  rentas.forEach(r => {
    console.log(
      `Cliente: ${r.nombre_cliente} | Habitación: ${r.habitacion_id} | Fecha Ingreso: ${r.fecha_ingreso} | Fecha Salida: ${r.fecha_salida} | Tipo de Pago: ${r.tipo_pago} | Monto: $${r.monto} | Monto en letras: ${r.monto_letras}`
    );
  });
}

// Mostrar estados de habitaciones
export async function showEstadosHabitaciones() {
  const habitaciones = await Room.find();
  console.log('Estados de Habitaciones:');
  habitaciones.forEach(h => {
    let color = h.estado === 'disponible' ? 'gris' : h.estado === 'ocupado' ? 'rojo' : 'naranja';
    console.log(`Habitación ${h.numero}: Estado ${h.estado} (${color})`);
  });
}

// Mostrar precios de temporada alta (mes 11, 12, 1)
export async function showPreciosTemporadaAlta() {
  const precios = await Room.precios();
  console.log('Precios en temporada alta (noviembre, diciembre, enero):');
  precios
    .filter(p => [11, 12, 1].includes(p.mes))
    .forEach(p => {
      console.log(`Mes: ${p.mes} | Tipo: ${p.tipo_habitacion} | Monto: $${p.monto}`);
    });
}

// Renderizar vista de habitaciones
export async function renderHabitacionesView(req, res) {
  const habitaciones = await Room.find();
  res.render('habitaciones', { habitaciones });
}

// Renderizar vista de precios
export async function renderPreciosView(req, res) {
  const precios = await Room.precios();
  res.render('precios', { precios });
}

// Renderizar vista de reservaciones
export async function renderReservacionesView(req, res) {
  const reservaciones = await Room.reservaciones();
  res.render('reservaciones', { reservaciones });
}

// Renderizar vista de rentas
export async function renderRentasView(req, res) {
  const rentas = await Room.rentas();
  res.render('rentas', { rentas });
}

// Renderizar vista de membresías
export function renderMembershipsView(req, res) {
  res.render('memberships', { memberships });
}

// Ejecutar funciones desde la terminal
const action = process.argv[2];
switch (action) {
  case 'show-habitaciones':
    await showHabitacionesGeneral();
    break;
  case 'show-precios':
    await showPreciosPorMes();
    break;
  case 'show-reservaciones':
    await showReservaciones();
    break;
  case 'show-rentas':
    await showRentas();
    break;
  case 'show-estados':
    await showEstadosHabitaciones();
    break;
  case 'show-precios-alta':
    await showPreciosTemporadaAlta();
    break;
  case 'show-memberships':
    showAvailableMemberships();
    break;
}
