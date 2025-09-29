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
      // Delegar toda la lógica de negocio al servicio
      const newMembershipData = await MembershipService.createCompleteMembership(req.body);

      // Responder con la información completa que devuelve el servicio
      res.json({
        success: true,
        message: "Membresía creada exitosamente",
        data: newMembershipData,
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

  async serveQRCode(req, res) {
    try {
      const { id_activa } = req.params;
      const membresia = await MembershipModel.getMembresiaById(id_activa);

      if (!membresia || !membresia.qr_path) {
        return res.status(404).json({ error: "QR no encontrado" });
      }

      // La ruta en la BD es relativa (ej: "/uploads/qrs/qr_31_nombre.png")
      // Construir la ruta absoluta: public + ruta_relativa
      const qrFullPath = path.join(process.cwd(), "public", membresia.qr_path);

      if (!fs.existsSync(qrFullPath)) {
        return res.status(404).json({ error: "Archivo QR no encontrado" });
      }

      // Servir el archivo directamente
      res.sendFile(qrFullPath);

    } catch (error) {
      console.error("Error al servir QR:", error);
      res.status(500).json({ error: "Error al obtener el QR" });
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
