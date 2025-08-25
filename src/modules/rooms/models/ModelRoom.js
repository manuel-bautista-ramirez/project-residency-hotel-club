// Simulación de modelo Room (puedes reemplazar por lógica de base de datos)
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

const precios = [
  { id: 1, tipo_habitacion: "sencilla", mes: 1, monto: 1000 },
  { id: 2, tipo_habitacion: "suite", mes: 1, monto: 1500 },
  { id: 3, tipo_habitacion: "sencilla", mes: 11, monto: 1200 },
  { id: 4, tipo_habitacion: "suite", mes: 11, monto: 1800 },
  // ...agrega más meses si lo necesitas
];

const reservaciones = [
  {
    id: 1,
    habitacion_id: 2,
    usuario_id: 1,
    nombre_cliente: "Juan Pérez",
    fecha_reserva: "2024-06-01",
    fecha_ingreso: "2024-06-10",
    fecha_salida: "2024-06-12",
    monto: 1000,
    monto_letras: "Mil pesos",
    fecha_registro: "2024-06-01T10:00:00"
  }
  // ...agrega más reservaciones si lo necesitas
];

const rentas = [
  {
    id: 1,
    habitacion_id: 2,
    usuario_id: 1,
    nombre_cliente: "Juan Pérez",
    fecha_ingreso: "2024-06-10",
    fecha_salida: "2024-06-12",
    tipo_pago: "efectivo",
    monto: 1000,
    monto_letras: "Mil pesos",
    fecha_registro: "2024-06-10T12:00:00"
  }
  // ...agrega más rentas si lo necesitas
];

export const memberships = [
  { id: 1, name: "Básica", price: 500 },
  { id: 2, name: "Premium", price: 1200 },
  { id: 3, name: "VIP", price: 2500 }
];

const Room = {
  find: async () => habitaciones,
  precios: async () => precios,
  reservaciones: async () => reservaciones,
  rentas: async () => rentas,
  setEstado: async (id, nuevoEstado) => {
    const hab = habitaciones.find(h => h.id === id);
    if (hab) hab.estado = nuevoEstado;
    return hab;
  }
};

export default Room;
