// ModelRoom.js
// Modelo simulado de habitaciones, precios, reservaciones y rentas

/** Helpers **/
const nextId = (arr) => (!arr.length ? 1 : Math.max(...arr.map(x => Number(x.id))) + 1);
const numeroALetras = (num) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(num);

/** Datos simulados **/

// 1) Habitaciones
const habitaciones = [
  { id: 1, numero: "101", tipo: "sencilla", estado: "disponible" },
  { id: 2, numero: "102", tipo: "sencilla", estado: "ocupado" },
  { id: 3, numero: "103", tipo: "sencilla", estado: "limpieza" },
  { id: 4, numero: "104", tipo: "sencilla", estado: "disponible" },
  { id: 5, numero: "106", tipo: "sencilla", estado: "disponible" },
  { id: 6, numero: "107", tipo: "sencilla", estado: "disponible" },
  { id: 7, numero: "108", tipo: "sencilla", estado: "disponible" },
  { id: 8, numero: "109", tipo: "sencilla", estado: "disponible" },
  { id: 9, numero: "105", tipo: "suite", estado: "ocupado" },
  { id: 10, numero: "110", tipo: "suite", estado: "disponible" },
];

// 2) Precios
const precios = [
  { id: 1, tipo_habitacion: "sencilla", mes: 1, monto: 100 },
  { id: 2, tipo_habitacion: "suite", mes: 1, monto: 200 },
  { id: 3, tipo_habitacion: "sencilla", mes: 11, monto: 120 },
  { id: 4, tipo_habitacion: "suite", mes: 11, monto: 250 },
  // ... puedes agregar todos los meses como en tu DB
];

// 3) Reservaciones simuladas
let reservaciones = [
  {
    id: 1,
    habitacion_id: 1,
    usuario_id: 1,
    nombre_cliente: "Juan Perez",
    correo_cliente: "example@gmail.com",
    telefono_cliente: "4453235434",
    fecha_reserva: "2024-06-01",
    fecha_ingreso: "2024-06-10",
    fecha_salida: "2024-06-15",
    monto: 600,
    monto_letras: numeroALetras(600),
    fecha_registro: new Date().toISOString(),
  },
  {
    id: 2,
    habitacion_id: 2,
    usuario_id: 1,
    nombre_cliente: "Maria Lopez",
    correo_cliente: "example1@gmail.com",
    telefono_cliente: "4453235454",
    fecha_reserva: "2024-06-02",
    fecha_ingreso: "2024-06-12",
    fecha_salida: "2024-06-14",
    monto: 300,
    monto_letras: numeroALetras(300),
    fecha_registro: new Date().toISOString(),
  },
];

// 4) Rentas simuladas
let rentas = [
  {
    id: 1,
    habitacion_id: 1,
    usuario_id: 1,
    nombre_cliente: "Luis Gomez",
    correo_cliente: "example@gmail.com",
    telefono_cliente: "4531246364",
    fecha_ingreso: "2024-06-05",
    fecha_salida: "2024-06-10",
    tipo_pago: "efectivo",
    monto: 500,
    monto_letras: numeroALetras(500),
    fecha_registro: new Date().toISOString(),
  },
  {
    id: 2,
    habitacion_id: 2,
    usuario_id: 2,
    nombre_cliente: "Ana Torres",
    correo_cliente: "example2@gmail.com",
    telefono_cliente: "4431246364",
    fecha_ingreso: "2024-06-08",
    fecha_salida: "2024-06-12",
    tipo_pago: "tarjeta",
    monto: 400,
    monto_letras: numeroALetras(400),
    fecha_registro: new Date().toISOString(),
  },
];

/** Modelo **/
const Room = {
  find: async () => habitaciones,
  precios: async () => precios,
  reservaciones: async () => reservaciones,
  rentas: async () => rentas,

  setEstado: async (id, nuevoEstado) => {
    const hab = habitaciones.find((h) => Number(h.id) === Number(id));
    if (hab) hab.estado = nuevoEstado;
    return hab || null;
  },

  crearReservacion: async ({
    habitacion_id,
    usuario_id,
    nombre_cliente,
    correo_cliente,
    telefono_cliente,
    fecha_ingreso,
    fecha_salida,
    monto,
  }) => {
    const hab = habitaciones.find((h) => Number(h.id) === Number(habitacion_id));
    if (!hab || hab.estado === "ocupado") return null;

    const nuevaReserva = {
      id: nextId(reservaciones),
      habitacion_id: Number(habitacion_id),
      usuario_id: Number(usuario_id),
      nombre_cliente,
      correo_cliente,
      telefono_cliente,
      fecha_reserva: new Date().toISOString().split("T")[0],
      fecha_ingreso,
      fecha_salida,
      monto: monto ?? 0,
      monto_letras: numeroALetras(monto ?? 0),
      fecha_registro: new Date().toISOString(),
    };
    reservaciones.push(nuevaReserva);
    return nuevaReserva;
  },

  crearRenta: async ({
    habitacion_id,
    usuario_id,
    nombre_cliente,
    correo_cliente,
    telefono_cliente,
    fecha_ingreso,
    fecha_salida,
    tipo_pago,
    monto,
  }) => {
    const hab = habitaciones.find((h) => Number(h.id) === Number(habitacion_id));
    if (!hab || hab.estado === "ocupado") return null;

    const nuevaRenta = {
      id: nextId(rentas),
      habitacion_id: Number(habitacion_id),
      usuario_id: Number(usuario_id),
      nombre_cliente,
      correo_cliente,
      telefono_cliente,
      fecha_ingreso,
      fecha_salida,
      tipo_pago,
      monto: monto ?? 0,
      monto_letras: numeroALetras(monto ?? 0),
      fecha_registro: new Date().toISOString(),
    };

    rentas.push(nuevaRenta);
    hab.estado = "ocupado";
    return nuevaRenta;
  },

  findRentaById: async (id) => rentas.find((r) => Number(r.id) === Number(id)) || null,
  updateRenta: async (id, data) => {
    const idx = rentas.findIndex((r) => Number(r.id) === Number(id));
    if (idx === -1) return null;
    rentas[idx] = { ...rentas[idx], ...data };
    return rentas[idx];
  },
  deleteRenta: async (id) => {
    const idx = rentas.findIndex((r) => Number(r.id) === Number(id));
    if (idx === -1) return false;
    const hab = habitaciones.find((h) => h.id === rentas[idx].habitacion_id);
    if (hab) hab.estado = "disponible";
    rentas.splice(idx, 1);
    return true;
  },

  saveRentas: async (newRentas) => {
    rentas = Array.isArray(newRentas) ? newRentas : rentas;
    return rentas;
  },
  saveReservaciones: async (newReservas) => {
    reservaciones = Array.isArray(newReservas) ? newReservas : reservaciones;
    return reservaciones;
  },
};

export default Room;
