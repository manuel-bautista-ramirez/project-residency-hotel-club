// utils.js
export function numeroALetras(num) {
  // Función simple para convertir número a texto
  const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  return formatter.format(num); // Ej: 1200 -> $1,200.00
}

// Base simulada de habitaciones
const habitaciones = [
  { id: 1, numero: "101", tipo: "sencilla", estado: "disponible" },
  { id: 2, numero: "102", tipo: "sencilla", estado: "ocupado" },
  { id: 3, numero: "103", tipo: "sencilla", estado: "limpieza" },
  { id: 4, numero: "104", tipo: "sencilla", estado: "disponible" },
  { id: 5, numero: "106", tipo: "sencilla", estado: "disponible" },
  { id: 6, numero: "107", tipo: "sencilla", estado: "disponible" },
  { id: 7, numero: "108", tipo: "sencilla", estado: "disponible" },
  { id: 8, numero: "109", tipo: "sencilla", estado: "disponible" },
  { id: 9, numero: "105", tipo: "suite", estado: "disponible" },
  { id: 10, numero: "110", tipo: "suite", estado: "disponible" },
];

// Base simulada de precios por tipo de habitación y mes
const precios = [
  { id: 1, tipo_habitacion: "sencilla", mes: 1, monto: 1000 },
  { id: 2, tipo_habitacion: "suite", mes: 1, monto: 1500 },
  { id: 3, tipo_habitacion: "sencilla", mes: 11, monto: 1200 },
  { id: 4, tipo_habitacion: "suite", mes: 11, monto: 1800 },
];

// Reservaciones y rentas simuladas
const reservaciones = [];
const rentas = [];

const Room = {
  // Obtener todas las habitaciones
  find: async () => habitaciones,

  // Obtener precios
  precios: async () => precios,

  // Obtener reservaciones
  reservaciones: async () => reservaciones,

  // Obtener rentas
  rentas: async () => rentas,

  // Cambiar estado de habitación
  setEstado: async (id, nuevoEstado) => {
    const hab = habitaciones.find(h => h.id === id);
    if (hab) hab.estado = nuevoEstado;
    return hab;
  },

  // Crear reservación
  crearReservacion: async ({ habitacion_id, usuario_id, nombre_cliente, fecha_ingreso, fecha_salida }) => {
    const hab = habitaciones.find(h => h.id === habitacion_id);
    if (!hab || hab.estado === 'ocupado') return null;

    const mesIngreso = new Date(fecha_ingreso).getMonth() + 1;
    const precio = precios.find(p => p.tipo_habitacion === hab.tipo && p.mes === mesIngreso);
    const monto = precio ? precio.monto : 0;

    const nuevaReserva = {
      id: reservaciones.length + 1,
      habitacion_id,
      usuario_id,
      nombre_cliente,
      fecha_reserva: new Date().toISOString().split('T')[0],
      fecha_ingreso,
      fecha_salida,
      monto,
      monto_letras: numeroALetras(monto),
      fecha_registro: new Date().toISOString()
    };

    reservaciones.push(nuevaReserva);
    return nuevaReserva;
  },

  // Crear renta (ocupación real)
  crearRenta: async ({ habitacion_id, usuario_id, nombre_cliente, fecha_ingreso, fecha_salida, tipo_pago }) => {
    const hab = habitaciones.find(h => h.id === habitacion_id);
    if (!hab || hab.estado === 'ocupado') return null;

    const mesIngreso = new Date(fecha_ingreso).getMonth() + 1;
    const precio = precios.find(p => p.tipo_habitacion === hab.tipo && p.mes === mesIngreso);
    const monto = precio ? precio.monto : 0;

    const nuevaRenta = {
      id: rentas.length + 1,
      habitacion_id,
      usuario_id,
      nombre_cliente,
      fecha_ingreso,
      fecha_salida,
      tipo_pago,
      monto,
      monto_letras: numeroALetras(monto),
      fecha_registro: new Date().toISOString()
    };

    rentas.push(nuevaRenta);

    // Cambiar estado de habitación a ocupado automáticamente
    hab.estado = 'ocupado';
    return nuevaRenta;
  },

  // Obtener precio vigente por tipo de habitación y mes
  obtenerPrecio: async (tipo, mes) => {
    return precios.find(p => p.tipo_habitacion === tipo && p.mes === mes);
  }
};

export default Room;
