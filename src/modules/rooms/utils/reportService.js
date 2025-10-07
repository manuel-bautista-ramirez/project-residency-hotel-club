// services/reportService.js
import { getAllRentas, getAllReservationes } from "../models/ModelRoom.js";

import emailService from "../../../services/emailService.js";
// Importar el servicio centralizado de WhatsApp
import { generarQRReporte, generarPayloadReporte } from "./qrGenerator.js";

export const ReportService = {
  /**
   * Genera reporte de rentas por rango de fechas
   */
  async generateRentReport(fechaInicio, fechaFin, filtros = {}) {
    try {
      const rentas = await getAllRentas();

      // Filtrar por fechas si se proporcionan
      let rentasFiltradas = rentas;
      if (fechaInicio && fechaFin) {
        rentasFiltradas = rentas.filter(renta => {
          const fechaRenta = new Date(renta.fecha_ingreso);
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);
          return fechaRenta >= inicio && fechaRenta <= fin;
        });
      }

      // Aplicar filtros adicionales
      if (filtros.habitacion) {
        rentasFiltradas = rentasFiltradas.filter(renta =>
          renta.numero_habitacion.toString().includes(filtros.habitacion)
        );
      }

      if (filtros.cliente) {
        rentasFiltradas = rentasFiltradas.filter(renta =>
          renta.nombre_cliente.toLowerCase().includes(filtros.cliente.toLowerCase())
        );
      }

      if (filtros.tipoPago) {
        rentasFiltradas = rentasFiltradas.filter(renta =>
          renta.tipo_pago === filtros.tipoPago
        );
      }

      // Calcular estadísticas
      const totalRentas = rentasFiltradas.length;
      const ingresoTotal = rentasFiltradas.reduce((sum, renta) => sum + parseFloat(renta.monto || 0), 0);
      const promedioIngreso = totalRentas > 0 ? ingresoTotal / totalRentas : 0;

      // Agrupar por tipo de pago
      const porTipoPago = rentasFiltradas.reduce((acc, renta) => {
        const tipo = renta.tipo_pago || 'No especificado';
        if (!acc[tipo]) {
          acc[tipo] = { cantidad: 0, monto: 0 };
        }
        acc[tipo].cantidad++;
        acc[tipo].monto += parseFloat(renta.monto || 0);
        return acc;
      }, {});

      // Agrupar por habitación
      const porHabitacion = rentasFiltradas.reduce((acc, renta) => {
        const hab = renta.numero_habitacion;
        if (!acc[hab]) {
          acc[hab] = { cantidad: 0, monto: 0 };
        }
        acc[hab].cantidad++;
        acc[hab].monto += parseFloat(renta.monto || 0);
        return acc;
      }, {});

      const reporte = {
        tipo: 'rentas',
        fechaInicio,
        fechaFin,
        filtros,
        datos: rentasFiltradas,
        estadisticas: {
          totalRentas,
          ingresoTotal,
          promedioIngreso,
          porTipoPago,
          porHabitacion
        },
        fechaGeneracion: new Date().toISOString()
      };

      // Generar QR para el reporte
      const qrPayload = generarPayloadReporte(reporte);
      const qrPath = await generarQRReporte(qrPayload, 'rentas', fechaInicio, fechaFin);
      reporte.qrPath = qrPath;

      return reporte;

    } catch (error) {
      console.error('Error generando reporte de rentas:', error);
      throw error;
    }
  },

  /**
   * Genera reporte de reservaciones por rango de fechas
   */
  async generateReservationReport(fechaInicio, fechaFin, filtros = {}) {
    try {
      const reservaciones = await getAllReservationes();

      // Filtrar por fechas si se proporcionan
      let reservacionesFiltradas = reservaciones;
      if (fechaInicio && fechaFin) {
        reservacionesFiltradas = reservaciones.filter(reservacion => {
          const fechaReservacion = new Date(reservacion.fecha_ingreso);
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);
          return fechaReservacion >= inicio && fechaReservacion <= fin;
        });
      }

      // Aplicar filtros adicionales
      if (filtros.habitacion) {
        reservacionesFiltradas = reservacionesFiltradas.filter(reservacion =>
          reservacion.numero_habitacion.toString().includes(filtros.habitacion)
        );
      }

      if (filtros.cliente) {
        reservacionesFiltradas = reservacionesFiltradas.filter(reservacion =>
          reservacion.nombre_cliente.toLowerCase().includes(filtros.cliente.toLowerCase())
        );
      }

      // Calcular estadísticas
      const totalReservaciones = reservacionesFiltradas.length;
      const montoTotal = reservacionesFiltradas.reduce((sum, reservacion) => sum + parseFloat(reservacion.monto || 0), 0);
      const promedioMonto = totalReservaciones > 0 ? montoTotal / totalReservaciones : 0;

      // Agrupar por habitación
      const porHabitacion = reservacionesFiltradas.reduce((acc, reservacion) => {
        const hab = reservacion.numero_habitacion;
        if (!acc[hab]) {
          acc[hab] = { cantidad: 0, monto: 0 };
        }
        acc[hab].cantidad++;
        acc[hab].monto += parseFloat(reservacion.monto || 0);
        return acc;
      }, {});

      // Agrupar por estado
      const porEstado = reservacionesFiltradas.reduce((acc, reservacion) => {
        const estado = reservacion.estado || 'No especificado';
        if (!acc[estado]) {
          acc[estado] = { cantidad: 0, monto: 0 };
        }
        acc[estado].cantidad++;
        acc[estado].monto += parseFloat(reservacion.monto || 0);
        return acc;
      }, {});

      const reporte = {
        tipo: 'reservaciones',
        fechaInicio,
        fechaFin,
        filtros,
        datos: reservacionesFiltradas,
        estadisticas: {
          totalReservaciones,
          montoTotal,
          promedioMonto,
          porHabitacion,
          porEstado
        },
        fechaGeneracion: new Date().toISOString()
      };

      // Generar QR para el reporte
      const qrPayload = generarPayloadReporte(reporte);
      const qrPath = await generarQRReporte(qrPayload, 'reservaciones', fechaInicio, fechaFin);
      reporte.qrPath = qrPath;

      return reporte;

    } catch (error) {
      console.error('Error generando reporte de reservaciones:', error);
      throw error;
    }
  },

  /**
   * Genera reporte consolidado (rentas + reservaciones)
   */
  async generateConsolidatedReport(fechaInicio, fechaFin, filtros = {}) {
    try {
      const [reporteRentas, reporteReservaciones] = await Promise.all([
        this.generateRentReport(fechaInicio, fechaFin, filtros),
        this.generateReservationReport(fechaInicio, fechaFin, filtros)
      ]);

      const ingresoTotalRentas = reporteRentas.estadisticas.ingresoTotal;
      const montoTotalReservaciones = reporteReservaciones.estadisticas.montoTotal;
      const ingresoTotalConsolidado = ingresoTotalRentas + montoTotalReservaciones;

      const reporte = {
        tipo: 'consolidado',
        fechaInicio,
        fechaFin,
        filtros,
        rentas: reporteRentas,
        reservaciones: reporteReservaciones,
        resumenConsolidado: {
          totalRentas: reporteRentas.estadisticas.totalRentas,
          totalReservaciones: reporteReservaciones.estadisticas.totalReservaciones,
          ingresoTotalRentas,
          montoTotalReservaciones,
          ingresoTotalConsolidado,
          ocupacionTotal: reporteRentas.estadisticas.totalRentas + reporteReservaciones.estadisticas.totalReservaciones
        },
        fechaGeneracion: new Date().toISOString()
      };

      // Generar QR para el reporte consolidado
      const qrPayload = generarPayloadReporte(reporte);
      const qrPath = await generarQRReporte(qrPayload, 'consolidado', fechaInicio, fechaFin);
      reporte.qrPath = qrPath;

      return reporte;

    } catch (error) {
      console.error('Error generando reporte consolidado:', error);
      throw error;
    }
  },

  /**
   * Envía reporte por correo electrónico
   */
  async sendReportByEmail(reporte, destinatario, asunto) {
    try {
      const subject = asunto || `Reporte de ${reporte.tipo} - Hotel Club`;
      const html = `
        <h1>Reporte de ${reporte.tipo}</h1>
        <p><strong>Período:</strong> ${reporte.fechaInicio || 'N/A'} - ${reporte.fechaFin || 'N/A'}</p>
        <h2>Resumen</h2>
        <ul>
          <li>Total de Registros: ${reporte.estadisticas.totalRentas || reporte.estadisticas.totalReservaciones}</li>
          <li>Ingreso Total: $${(reporte.estadisticas.ingresoTotal || reporte.estadisticas.montoTotal).toFixed(2)}</li>
        </ul>
        <p><em>Reporte generado el ${new Date(reporte.fechaGeneracion).toLocaleString('es-MX')}</em></p>
      `;

      await emailService.send({
        to: destinatario,
        subject: subject,
        html: html
      });

      return { success: true, message: 'Reporte enviado por correo exitosamente' };
    } catch (error) {
      console.error('Error enviando reporte por correo:', error);
      throw error;
    }
  },

  /**
   * Envía reporte por WhatsApp
   */
  async sendReportByWhatsApp(reporte, telefono) {
    try {
      const mensaje = this.formatReportForWhatsApp(reporte);

      await sendWhatsAppMessage({
        to: telefono,
        message: mensaje
      });

      return { success: true, message: 'Reporte enviado por WhatsApp exitosamente' };
    } catch (error) {
      console.error('Error enviando reporte por WhatsApp:', error);
      throw error;
    }
  },

  /**
   * Formatea el reporte para WhatsApp
   */
  formatReportForWhatsApp(reporte) {
    let mensaje = `🏨 *HOTEL CLUB - REPORTE*\n\n`;

    if (reporte.tipo === 'rentas') {
      mensaje += `📊 *REPORTE DE RENTAS*\n`;
      mensaje += `📅 Período: ${reporte.fechaInicio || 'Inicio'} - ${reporte.fechaFin || 'Fin'}\n\n`;
      mensaje += `📈 *RESUMEN:*\n`;
      mensaje += `• Total rentas: ${reporte.estadisticas.totalRentas}\n`;
      mensaje += `• Ingreso total: $${reporte.estadisticas.ingresoTotal.toFixed(2)}\n`;
      mensaje += `• Promedio por renta: $${reporte.estadisticas.promedioIngreso.toFixed(2)}\n\n`;

      if (Object.keys(reporte.estadisticas.porTipoPago).length > 0) {
        mensaje += `💳 *POR TIPO DE PAGO:*\n`;
        Object.entries(reporte.estadisticas.porTipoPago).forEach(([tipo, datos]) => {
          mensaje += `• ${tipo}: ${datos.cantidad} rentas - $${datos.monto.toFixed(2)}\n`;
        });
      }
    } else if (reporte.tipo === 'reservaciones') {
      mensaje += `📊 *REPORTE DE RESERVACIONES*\n`;
      mensaje += `📅 Período: ${reporte.fechaInicio || 'Inicio'} - ${reporte.fechaFin || 'Fin'}\n\n`;
      mensaje += `📈 *RESUMEN:*\n`;
      mensaje += `• Total reservaciones: ${reporte.estadisticas.totalReservaciones}\n`;
      mensaje += `• Monto total: $${reporte.estadisticas.montoTotal.toFixed(2)}\n`;
      mensaje += `• Promedio por reservación: $${reporte.estadisticas.promedioMonto.toFixed(2)}\n`;
    } else if (reporte.tipo === 'consolidado') {
      mensaje += `📊 *REPORTE CONSOLIDADO*\n`;
      mensaje += `📅 Período: ${reporte.fechaInicio || 'Inicio'} - ${reporte.fechaFin || 'Fin'}\n\n`;
      mensaje += `📈 *RESUMEN GENERAL:*\n`;
      mensaje += `• Total rentas: ${reporte.resumenConsolidado.totalRentas}\n`;
      mensaje += `• Total reservaciones: ${reporte.resumenConsolidado.totalReservaciones}\n`;
      mensaje += `• Ingreso total: $${reporte.resumenConsolidado.ingresoTotalConsolidado.toFixed(2)}\n`;
      mensaje += `• Ocupación total: ${reporte.resumenConsolidado.ocupacionTotal}\n`;
    }

    mensaje += `\n⏰ Generado: ${new Date(reporte.fechaGeneracion).toLocaleString('es-MX')}`;

    return mensaje;
  }
};
