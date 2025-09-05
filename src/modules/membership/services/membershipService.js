// services/membershipService.js
import { MembershipModel } from "../models/modelMembership.js";
import { generarQRArchivo } from "../utils/qrGenerator.js";
import { sendEmail } from "../utils/nodeMailer.js";

export const MembershipService = {
  async createMembershipContract(membershipData) {
    const { id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin } = membershipData;
    return await MembershipModel.createMembershipContract({
      id_cliente,
      id_tipo_membresia,
      fecha_inicio,
      fecha_fin,
    });
  },
  async generateQRCode(payload, id_membresia) {
    try {
      const qrPath = await generarQRArchivo(
        payload,
        `membresia_${id_membresia}.png`
      );
      return qrPath;
    } catch (error) {
      console.error("Error generando código QR:", error);
      throw new Error("No se pudo generar el código QR");
    }
  },

  async activateMembership(activationData) {
    const { id_cliente, id_membresia, fecha_inicio, fecha_fin, precio_final } = activationData;
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

  async generateQRPayload(cliente, tipo, fecha_inicio, fecha_fin, integrantesDB) {
    return {
      titular: { nombre: cliente?.nombre_completo || "N/D" },
      tipo_membresia: tipo?.nombre || "N/D",
      fecha_inicio,
      fecha_expiracion: fecha_fin,
      ...(integrantesDB.length > 0 && {
        integrantes: integrantesDB.map((i) => ({
          nombre: i.nombre_completo,
          relacion: i.relacion || null,
        })),
      }),
    };
  },

  async sendMembershipEmail(cliente, tipo, fecha_inicio, fecha_fin, qrPath, integrantesDB) {
    if (cliente?.correo) {
      await sendEmail({
        to: cliente.correo,
        subject: "Tu Membresía y Código QR",
        titularNombre: cliente.nombre_completo,
        tipoMembresia: tipo?.nombre || "N/D",
        fechaInicio: fecha_inicio,
        fechaFin: fecha_fin,
        qrPath,
        integrantes: integrantesDB,
      });
    }
  }
};