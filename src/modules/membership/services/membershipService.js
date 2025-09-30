// services/membershipService.js
import { MembershipModel } from "../models/modelMembership.js";
import { generarQRArchivo } from "../utils/qrGenerator.js";
import { sendReceiptEmail } from "../utils/nodeMailer.js";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

export const MembershipService = {
  async createMembershipContract(membershipData) {
    const { id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin } =
      membershipData;
    return await MembershipModel.createMembershipContract({
      id_cliente,
      id_tipo_membresia,
      fecha_inicio,
      fecha_fin,
    });
  },

  async generateQRCode(qrData, membershipId, titularNombre) {
    try {
      // Validar que los datos no estén vacíos
      if (!qrData || qrData.trim() === '') {
        throw new Error('Datos QR vacíos o inválidos');
      }
  
      // Guardar en public/uploads/qrs/
      const qrDir = path.join(process.cwd(), 'public', 'uploads', 'qrs');
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }
  
      // Limpiar nombre para el archivo
      const cleanName = titularNombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const qrFilename = `qr_${membershipId}_${cleanName}.png`;
      const qrFullPath = path.join(qrDir, qrFilename);
      
      // Ruta relativa para acceso web (desde public/)
      const qrWebPath = `/uploads/qrs/${qrFilename}`;
  
      console.log('📊 Generando QR con datos:', qrData.substring(0, 100) + '...');
  
      // Generar QR con configuración robusta
      await QRCode.toFile(qrFullPath, qrData, {
        errorCorrectionLevel: 'H', // Mayor corrección de errores
        type: 'png',
        margin: 2,
        width: 300,
        color: {
          dark: '#16a34a',
          light: '#FFFFFF'
        }
      });
  
      console.log(`✅ QR generado: ${qrFullPath}`);
      console.log(`✅ Ruta web: ${qrWebPath}`);
      
      return qrWebPath;
  
    } catch (error) {
      console.error('❌ Error generando QR:', error);
      
      // Intentar con datos mínimos como fallback
      try {
        console.log('🔄 Intentando con datos mínimos de respaldo...');
        
        const fallbackData = JSON.stringify({
          id: membershipId,
          t: 'Membresía',
          d: new Date().toISOString().split('T')[0]
        });
        
        const qrDir = path.join(process.cwd(), 'public', 'uploads', 'qrs');
        const cleanName = titularNombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const qrFilename = `qr_${membershipId}_${cleanName}_fallback.png`;
        const qrFullPath = path.join(qrDir, qrFilename);
        const qrWebPath = `/uploads/qrs/${qrFilename}`;
        
        await QRCode.toFile(qrFullPath, fallbackData, {
          errorCorrectionLevel: 'H',
          type: 'png',
          margin: 2,
          width: 300,
          color: {
            dark: '#16a34a',
            light: '#FFFFFF'
          }
        });
        
        console.log(`✅ QR de respaldo generado: ${qrWebPath}`);
        return qrWebPath;
        
      } catch (fallbackError) {
        console.error('❌ Error incluso con datos de respaldo:', fallbackError);
        throw new Error(`Error al generar QR: ${error.message}`);
      }
    }
  },

  async activateMembership(activationData) {
    const { id_cliente, id_membresia, fecha_inicio, fecha_fin, precio_final } =
      activationData;
    return await MembershipModel.activateMembership({
      id_cliente,
      id_membresia,
      fecha_inicio,
      fecha_fin,
      precio_final,
    });
  },

  async addFamilyMembers(id_activa, integrantes) {
    if (integrantes && integrantes.length > 0) {
      const integrantesData = integrantes.map((item) =>
        typeof item === "string"
          ? { nombre_completo: item, id_relacion: null }
          : {
              nombre_completo: item.nombre_completo || item.nombre || "",
              id_relacion: item.id_relacion || null,
            }
      );
      await MembershipModel.addFamilyMembers(id_activa, integrantesData);
    }
  },

  async getMembershipDetails(id_cliente, id_tipo_membresia, id_activa) {
    const [cliente, tipo, integrantesDB] = await Promise.all([
      MembershipModel.getClienteById(id_cliente),
      MembershipModel.getTipoMembresiaById(id_tipo_membresia),
      MembershipModel.getIntegrantesByActiva(id_activa),
    ]);

    return { cliente, tipo, integrantesDB };
  },

  async generateQRPayload(id_activa) {
    // The most robust QR payload is a simple, unique identifier.
    // All other details can be fetched from the server upon scanning.
    // This prevents the QR code from growing too large and failing.
    const qrData = {
      id_activa: id_activa,
    };
    return JSON.stringify(qrData);
  },
  // Nuevo método para enviar comprobante por email (sin QR)
  async sendMembershipReceiptEmail(
    cliente,
    tipo,
    fecha_inicio,
    fecha_fin,
    integrantesDB,
    metodo_pago,
    precio_final
  ) {
    if (cliente?.correo) {
      await sendReceiptEmail({
        to: cliente.correo,
        subject: "Comprobante de Membresía - Hotel Club",
        titularNombre: cliente.nombre_completo,
        tipoMembresia: tipo?.nombre || "N/D",
        fechaInicio: fecha_inicio,
        fechaFin: fecha_fin,
        metodoPago: metodo_pago || "No especificado",
        precioFinal: precio_final,
        integrantes: integrantesDB,
      });
    }
  },

  async createCompleteMembership(membershipData) {
    const {
      id_cliente,
      id_tipo_membresia,
      fecha_inicio,
      integrantes,
      metodo_pago,
      descuento,
    } = membershipData;

    // --- REFUERZO DE SEGURIDAD ---
    // Se ignoran el precio y fecha_fin enviados por el cliente y se recalculan en el servidor.
    const {
      precio_final: authoritative_price,
      fecha_fin: authoritative_end_date,
    } = await this.calculateMembershipDetails(
      id_tipo_membresia,
      fecha_inicio,
      descuento
    );

    // 1️⃣ Crear contrato en membresias
    const id_membresia = await this.createMembershipContract({
      id_cliente,
      id_tipo_membresia,
      fecha_inicio,
      fecha_fin: authoritative_end_date, // Usar valor calculado
    });

    // 2️⃣ Activar membresía
    const id_activa = await this.activateMembership({
      id_cliente,
      id_membresia,
      fecha_inicio,
      fecha_fin: authoritative_end_date, // Usar valor calculado
      precio_final: authoritative_price, // Usar valor calculado
    });

    // 3️⃣ Registrar integrantes
    await this.addFamilyMembers(id_activa, integrantes);

    // 4️⃣ Obtener datos para el QR
    const { cliente, tipo, integrantesDB } = await this.getMembershipDetails(
      id_cliente,
      id_tipo_membresia,
      id_activa
    );

    // 5️⃣ Armar payload del QR
    const payloadQR = await this.generateQRPayload(id_activa);

    // 6️⃣ Generar archivo PNG del QR
    const qrPath = await this.generateQRCode(
      payloadQR,
      id_activa,
      cliente.nombre_completo
    );

    // 7️⃣ Actualizar la ruta del QR en la base de datos
    await MembershipModel.updateQRPath(id_activa, qrPath);

    // 8️⃣ Registrar el pago
    if (metodo_pago) {
      await MembershipModel.recordPayment({
        id_activa,
        id_metodo_pago: metodo_pago,
        monto: authoritative_price, // Usar valor calculado
      });
    }

    // 9️⃣ Obtener información completa para el modal
    const membresiaCompleta = await MembershipModel.getMembresiaConPago(
      id_activa
    );

    // 🔟 Enviar email de comprobante
    await this.sendMembershipReceiptEmail(
      cliente,
      tipo,
      fecha_inicio,
      authoritative_end_date, // Usar valor calculado
      integrantesDB,
      membresiaCompleta.metodo_pago,
      authoritative_price // Usar valor calculado
    );

    // Devolver la información completa para la respuesta
    return {
      id_activa: id_activa,
      id_membresia: id_membresia,
      titular: cliente.nombre_completo,
      tipo_membresia: tipo.nombre,
      fecha_inicio: fecha_inicio,
      fecha_fin: authoritative_end_date,
      precio_final: parseFloat(authoritative_price),
      metodo_pago: membresiaCompleta.metodo_pago || "No especificado",
      integrantes: integrantesDB,
      qr_path: qrPath,
    };
  },

  async calculateMembershipDetails(id_tipo_membresia, fecha_inicio, descuento = 0) {
    if (!id_tipo_membresia || !fecha_inicio) {
      throw new Error("El tipo de membresía y la fecha de inicio son requeridos.");
    }

    const tipoMembresia = await MembershipModel.getTipoMembresiaById(id_tipo_membresia);
    if (!tipoMembresia) {
      throw new Error("El tipo de membresía no es válido.");
    }

    // Calcular fecha de fin
    const startDate = new Date(fecha_inicio);
    const endDate = new Date(startDate);
    // Asumimos que la duración viene en días desde la BD
    const duracionDias = tipoMembresia.duracion_dias || 30;
    endDate.setDate(startDate.getDate() + duracionDias);

    const yyyy = endDate.getFullYear();
    const mm = String(endDate.getMonth() + 1).padStart(2, '0');
    const dd = String(endDate.getDate()).padStart(2, '0');
    const fecha_fin_calculada = `${yyyy}-${mm}-${dd}`;

    // Calcular precio final
    const precioBase = parseFloat(tipoMembresia.precio);
    const descuentoAplicado = Math.max(0, Math.min(100, descuento)); // Clamp discount between 0-100
    const precio_final_calculado = precioBase - (precioBase * (descuentoAplicado / 100));

    return {
      precio_final: precio_final_calculado.toFixed(2),
      fecha_fin: fecha_fin_calculada,
    };
  },

  async renewMembership(oldMembershipId, renewalData) {
    const {
      id_cliente,
      nombre_completo,
      telefono,
      correo,
      id_tipo_membresia,
      fecha_inicio,
      fecha_fin,
      id_metodo_pago,
    } = renewalData;

    // 1. Actualizar datos del cliente
    await MembershipModel.updateClient({
      id_cliente,
      nombre_completo,
      telefono,
      correo,
    });

    // 2. Desactivar la membresía antigua
    await MembershipModel.updateEstadoMembresia(oldMembershipId, 'Vencida');

    // 3. Crear el nuevo contrato de membresía
    const id_membresia = await MembershipModel.createMembershipContract({
      id_cliente,
      id_tipo_membresia,
      fecha_inicio,
      fecha_fin,
    });

    // 4. Activar la nueva membresía
    const tipoMembresia = await MembershipModel.getTipoMembresiaById(id_tipo_membresia);
    const precio_final = tipoMembresia.precio;

    const id_activa_nueva = await MembershipModel.activateMembership({
      id_cliente,
      id_membresia,
      fecha_inicio,
      fecha_fin,
      precio_final,
    });

    // 5. Registrar el pago
    await MembershipModel.recordPayment({
      id_activa: id_activa_nueva,
      id_metodo_pago,
      monto: precio_final,
    });
  },

  // Función para convertir número a palabras (básica)
  convertirNumeroALetras(numero) {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (numero === 0) return 'cero';
    if (numero === 100) return 'cien';
    
    let resultado = '';
    
    // Simplificación básica - puedes expandir esto según necesites
    if (numero < 10) {
      resultado = unidades[numero];
    } else if (numero < 100) {
      const dec = Math.floor(numero / 10);
      const uni = numero % 10;
      if (numero >= 10 && numero < 20) {
        const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
        resultado = especiales[numero - 10];
      } else {
        resultado = decenas[dec] + (uni > 0 ? ' y ' + unidades[uni] : '');
      }
    } else if (numero < 1000) {
      const cen = Math.floor(numero / 100);
      const resto = numero % 100;
      resultado = centenas[cen] + (resto > 0 ? ' ' + this.convertirNumeroALetras(resto) : '');
    }
    
    return resultado + ' pesos';
  }
};