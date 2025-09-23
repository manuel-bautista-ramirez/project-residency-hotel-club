// controllers/createMemberController.js
import { ClientService } from "../services/clientService.js";
import { MembershipService } from "../services/membershipService.js";
import { MembershipModel } from "../models/modelMembership.js";
import path from "path";
import fs from "fs";
import { generarQRArchivo } from "../utils/qrGenerator.js";
import { fileURLToPath } from "url";

// Para usar __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MembershipController = {
  // Crear cliente principal
  async createClient(req, res) {
    try {
      const { nombre_completo, correo, telefono } = req.body;
      const result = await ClientService.createClient({
        nombre_completo,
        correo,
        telefono,
      });
      res.json(result);
    } catch (err) {
      console.error("Error en createClient:", err);
      res
        .status(500)
        .json({ error: "Error al crear el cliente", details: err.message });
    }
  },

  // Crear membresía (familiar o individual)
  async createMembership(req, res) {
    try {
      const {
        id_cliente,
        id_tipo_membresia,
        fecha_inicio,
        fecha_fin,
        precio_final,
        integrantes,
        metodo_pago,
      } = req.body;

      // 1️⃣ Crear contrato en membresias
      const id_membresia = await MembershipService.createMembershipContract({
        id_cliente,
        id_tipo_membresia,
        fecha_inicio,
        fecha_fin,
      });

      // 2️⃣ Activar membresía (sin QR path inicialmente)
      const id_activa = await MembershipService.activateMembership({
        id_cliente,
        id_membresia,
        fecha_inicio,
        fecha_fin,
        precio_final,
      });

      // 3️⃣ Registrar integrantes (si es familiar)
      await MembershipService.addFamilyMembers(id_activa, integrantes);

      // 4️⃣ Obtener datos para el QR
      const { cliente, tipo, integrantesDB } =
        await MembershipService.getMembershipDetails(
          id_cliente,
          id_tipo_membresia,
          id_activa
        );

      // 5️⃣ Armar payload del QR
      const payloadQR = await MembershipService.generateQRPayload(
        cliente,
        tipo,
        fecha_inicio,
        fecha_fin,
        integrantesDB
      );

      console.log("📋 Payload QR generado:", payloadQR);

      // 6️⃣ Generar archivo PNG del QR
      const qrPath = await MembershipService.generateQRCode(
        payloadQR,
        id_activa,
        cliente.nombre_completo
      );

      // 7️⃣ Actualizar la ruta del QR en la base de datos (debe ser ruta relativa)
      await MembershipModel.updateQRPath(id_activa, qrPath);

      // 8️⃣ Registrar el pago
      if (metodo_pago) {
        await MembershipModel.recordPayment({
          id_activa,
          id_metodo_pago: metodo_pago,
          monto: precio_final,
        });
      }

      // 9️⃣ Obtener información completa para el modal
      const membresiaCompleta = await MembershipModel.getMembresiaConPago(
        id_activa
      );

      // 🔟 Enviar email de comprobante (sin QR)
      await MembershipService.sendMembershipReceiptEmail(
        cliente,
        tipo,
        fecha_inicio,
        fecha_fin,
        integrantesDB,
        membresiaCompleta.metodo_pago,
        precio_final
      );

      // Responder con la información completa para el modal
      res.json({
        success: true,
        message: "Membresía creada exitosamente",
        data: {
          id_activa: id_activa,
          id_membresia: id_membresia,
          titular: cliente.nombre_completo,
          tipo_membresia: tipo.nombre,
          fecha_inicio: fecha_inicio,
          fecha_fin: fecha_fin,
          precio_final: parseFloat(precio_final),
          metodo_pago: membresiaCompleta.metodo_pago || "No especificado",
          integrantes: integrantesDB,
          qr_path: qrPath,
        },
      });
    } catch (err) {
      console.error("Error en createMembership:", err);
      res.status(500).json({
        success: false,
        message: "Error al crear la membresía",
        error: err.message,
      });
    }
  },

  // Método para descargar el QR - CORREGIDO para usar uploads/qrs/
  // Método para descargar el QR - CORREGIDO para usar public/uploads/qrs/
  async downloadQR(req, res) {
    try {
      const { id_activa } = req.params;
      const membresia = await MembershipModel.getMembresiaById(id_activa);

      if (!membresia || !membresia.qr_path) {
        return res
          .status(404)
          .json({ error: "QR no encontrado en la base de datos" });
      }

      // La ruta en la BD es relativa (ej: "/uploads/qrs/qr_31_nombre.png")
      // Construir la ruta absoluta: public + ruta_relativa
      const qrFullPath = path.join(process.cwd(), "public", membresia.qr_path);

      console.log("Buscando QR en:", qrFullPath);

      if (!fs.existsSync(qrFullPath)) {
        console.error("Archivo no encontrado en:", qrFullPath);
        return res
          .status(404)
          .json({ error: "Archivo QR no encontrado en el servidor" });
      }

      const filename = `membresia_${id_activa}_qr.png`;

      // Configurar headers para descarga
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Type", "image/png");

      // Enviar el archivo
      const fileStream = fs.createReadStream(qrFullPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error al descargar QR:", error);
      res.status(500).json({ error: "Error al descargar el QR" });
    }
  },

  async getTipoMembresiaById(req, res) {
    try {
      const { id } = req.params;
      const tipo = await MembershipModel.getTipoMembresiaById(id);
      if (!tipo)
        return res.status(404).json({ error: "Membresía no encontrada" });
      res.json(tipo);
    } catch (err) {
      console.error("Error obteniendo tipo de membresía:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  },

  async renderTiposMembresia(req, res) {
    try {
      const userRole = req.session.user?.role || "Recepcionista";
      const isAdmin = userRole === "Administrador";
      const tiposMembresia = await MembershipModel.getTiposMembresia();
      const tiposPago = await MembershipModel.getMetodosPago();
      const precioFamiliar = await MembershipModel.getPrecioFamiliar?.();

      res.render("membershipCreate", {
        title: "Crear Membresía",
        showFooter: true,
        isAdmin,
        userRole,
        tiposMembresia,
        tiposPago,
        precioFamiliar,
        apiBase: "/memberships",
      });
    } catch (error) {
      console.error("Error al cargar tipos de membresía:", error);
      res.status(500).send("Error al cargar tipos de membresía");
    }
  },
};

export { MembershipController };
