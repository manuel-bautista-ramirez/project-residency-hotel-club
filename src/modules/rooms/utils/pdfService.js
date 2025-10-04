// src/modules/rooms/utils/pdfService.js
import pdfGenerator from './pdfGenerator.js';
import whatsappService from '../../../services/whatsappService.js';
import { getRoomNumberById } from '../models/ModelRoom.js';

// Util: formatea fecha a string 'YYYY-MM-DD HH:mm:ss'
function formatDateTime(dt) {
  if (!dt) return null;
  const date = new Date(dt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Normaliza datos comunes para el PDF
async function buildBaseData({ id, client_name, phone, room_id, check_in, check_out, total, payment_method }) {
  const roomNumber = room_id ? await getRoomNumberById(room_id) : null;
  return {
    id,
    client_name,
    phone,
    room_number: roomNumber || room_id || '-',
    check_in: formatDateTime(check_in),
    check_out: formatDateTime(check_out),
    total: total ?? 0,
    payment_method: payment_method || 'Pendiente'
  };
}

// Genera y envía PDF de RENTA
export async function generateAndSendRentPDF({ telefono, renta }) {
  const base = await buildBaseData({
    id: renta.id,
    client_name: renta.client_name,
    phone: renta.phone,
    room_id: renta.room_id || renta.habitacion_id,
    check_in: renta.check_in,
    check_out: renta.check_out,
    total: renta.total,
    payment_method: renta.payment_method
  });
  const rentData = { ...base, type: 'rent' };

  const pdfResult = await pdfGenerator.generatePDF(rentData);
  if (!pdfResult.success) {
    return { success: false, step: 'generate', error: pdfResult.error };
  }

  const waResult = await whatsappService.enviarComprobanteRenta(telefono, rentData, pdfResult.filePath);
  if (!waResult.success) {
    return { success: false, step: 'whatsapp', error: waResult.error };
  }
  return { success: true, filePath: pdfResult.filePath, fileName: pdfResult.fileName };
}

// Genera y envía PDF de RESERVACIÓN
export async function generateAndSendReservationPDF({ telefono, reservacion }) {
  const base = await buildBaseData({
    id: reservacion.id_reservacion || reservacion.id,
    client_name: reservacion.nombre_cliente || reservacion.client_name,
    phone: reservacion.telefono || reservacion.phone,
    room_id: reservacion.habitacion_id,
    check_in: reservacion.fecha_ingreso,
    check_out: reservacion.fecha_salida,
    total: reservacion.precio_total ?? reservacion.total,
    payment_method: reservacion.tipo_pago || reservacion.payment_method
  });
  const reservationData = {
    ...base,
    type: 'reservation',
    reservation_created_at: reservacion.fecha_reserva || new Date()
  };

  const pdfResult = await pdfGenerator.generatePDF(reservationData);
  if (!pdfResult.success) {
    return { success: false, step: 'generate', error: pdfResult.error };
  }

  const waResult = await whatsappService.enviarComprobanteRenta(telefono, reservationData, pdfResult.filePath);
  if (!waResult.success) {
    return { success: false, step: 'whatsapp', error: waResult.error };
  }
  return { success: true, filePath: pdfResult.filePath, fileName: pdfResult.fileName };
}

export default {
  generateAndSendRentPDF,
  generateAndSendReservationPDF
};
