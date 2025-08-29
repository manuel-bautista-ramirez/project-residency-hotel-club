// src/modules/rooms/models/ModelRoom.js
import { pool } from '../../../dataBase/conecctionDataBase.js'; // tu conexión MySQL

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
];

// 3) Reservaciones simuladas
let reservaciones = [
  {
    id: 1,
    habitacion_id: 101,
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
    habitacion_id: 102,
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
    habitacion_id: 104,
    usuario_id: "Manuel",
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
    habitacion_id: 106,
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

/** Modelo Room **/
const Room = {
  // --- Arrays simulados ---
  find: async () => habitaciones,
  precios: async () => precios,
  reservaciones: async () => reservaciones,
  rentas: async () => rentas,

  setEstado: async (id, nuevoEstado) => {
    const hab = habitaciones.find((h) => Number(h.id) === Number(id));
    if (hab) hab.estado = nuevoEstado;
    return hab || null;
  },

  crearReservacion: async (data) => {
    const hab = habitaciones.find((h) => Number(h.id) === Number(data.habitacion_id));
    if (!hab || hab.estado === "ocupado") return null;

    const nuevaReserva = {
      id: nextId(reservaciones),
      habitacion_id: Number(data.habitacion_id),
      usuario_id: Number(data.usuario_id),
      nombre_cliente: data.nombre_cliente,
      correo_cliente: data.correo_cliente,
      telefono: data.telefono_cliente,
      fecha_reserva: new Date().toISOString().split("T")[0],
      fecha_ingreso: data.fecha_ingreso,
      fecha_salida: data.fecha_salida,
      monto: data.monto ?? 0,
      monto_letras: numeroALetras(data.monto ?? 0),
      fecha_registro: new Date().toISOString(),
    };
    reservaciones.push(nuevaReserva);
    return nuevaReserva;
  },

  crearRenta: async (data) => {
    const hab = habitaciones.find((h) => Number(h.id) === Number(data.habitacion_id));
    if (!hab || hab.estado === "ocupado") return null;

    const nuevaRenta = {
      id: nextId(rentas),
      habitacion_id: Number(data.habitacion_id),
      usuario_id: data.usuario_id,
      nombre_cliente: data.nombre_cliente,
      correo_cliente: data.correo_cliente,
      telefono: data.telefono_cliente,
      fecha_ingreso: data.fecha_ingreso,
      fecha_salida: data.fecha_salida,
      tipo_pago: data.tipo_pago,
      monto: data.monto ?? 0,
      monto_letras: numeroALetras(data.monto ?? 0),
      fecha_registro: new Date().toISOString(),
    };
    rentas.push(nuevaRenta);
    hab.estado = "ocupado";
    return nuevaRenta;
  },

  // --- Base de datos ---
  getEventosCalendario: async () => {
    try {
      const query = `
        SELECT r.id, r.nombre_cliente, m.correo_cliente, m.telefono_cliente, r.fecha_ingreso, r.fecha_salida, 'renta' AS tipo
        FROM rentas r
        INNER JOIN medios_mensajes m ON r.id_medio_mensaje = m.id_medio_mensaje
        UNION ALL
        SELECT res.id, res.nombre_cliente, m.correo_cliente, m.telefono_cliente, res.fecha_ingreso, res.fecha_salida, 'reserva' AS tipo
        FROM reservaciones res
        INNER JOIN medios_mensajes m ON res.id_medio_mensaje = m.id_medio_mensaje
      `;
      const [rows] = await pool.execute(query);
      return rows.map(evento => ({
        id: evento.id,
        title: evento.nombre_cliente,
        start: evento.fecha_ingreso,
        end: evento.fecha_salida ? new Date(new Date(evento.fecha_salida).getTime() + 24*60*60*1000).toISOString().split('T')[0] : evento.fecha_salida,
        tipo: evento.tipo,
        correo: evento.correo_cliente,
        telefono: evento.telefono_cliente
      }));
    } catch (err) {
      console.error("Error getEventosCalendario:", err);
      return [];
    }
  }
};

export { Room };
