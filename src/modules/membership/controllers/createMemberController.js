import { ClientService } from "../services/clientService.js";
import { MembershipService } from "../services/membershipService.js";
import path from "path";
import fs from "fs";

const MembershipController = {
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
      res.status(500).json({ error: "Error al crear el cliente", details: err.message });
    }
  },

  async createMembership(req, res) {
    try {
      const newMembershipData = await MembershipService.createCompleteMembership(req.body);
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

  async calculateDetails(req, res) {
    try {
      const { id_tipo_membresia, fecha_inicio, descuento } = req.body;
      const details = await MembershipService.calculateMembershipDetails(
        id_tipo_membresia,
        fecha_inicio,
        descuento
      );
      res.json(details);
    } catch (error) {
      console.error("Error calculating membership details:", error);
      res.status(400).json({ error: error.message });
    }
  },

  async serveQRCode(req, res) {
    try {
      const { id_activa } = req.params;
      const qrRelativePath = await MembershipService.getQRPath(id_activa);
      const qrFullPath = path.join(process.cwd(), "public", qrRelativePath);

      if (!fs.existsSync(qrFullPath)) {
        return res.status(404).json({ error: "Archivo QR no encontrado en el servidor" });
      }

      res.sendFile(qrFullPath);
    } catch (error) {
      console.error("Error al servir QR:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || "Error al obtener el QR" });
    }
  },

  async downloadQR(req, res) {
    try {
      const { id_activa } = req.params;
      const qrRelativePath = await MembershipService.getQRPath(id_activa);
      const qrFullPath = path.join(process.cwd(), "public", qrRelativePath);

      if (!fs.existsSync(qrFullPath)) {
        return res.status(404).json({ error: "Archivo QR no encontrado en el servidor" });
      }

      const filename = `membresia_${id_activa}_qr.png`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "image/png");

      const fileStream = fs.createReadStream(qrFullPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error al descargar QR:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || "Error al descargar el QR" });
    }
  },

  async getTipoMembresiaById(req, res) {
    try {
      const { id } = req.params;
      const tipo = await MembershipService.getMembershipTypeById(id);
      res.json(tipo);
    } catch (error) {
      console.error("Error obteniendo tipo de membresía:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || "Error del servidor" });
    }
  },

  async renderTiposMembresia(req, res) {
    try {
      const userRole = req.session.user?.role || "Recepcionista";
      const isAdmin = userRole === "Administrador";
      const pageData = await MembershipService.getDataForCreatePage();

      res.render("membershipCreate", {
        title: "Crear Membresía",
        showFooter: true,
        isAdmin,
        userRole,
        ...pageData,
        apiBase: "/memberships",
      });
    } catch (error) {
      console.error("Error al cargar tipos de membresía:", error);
      res.status(500).render('error', {
          title: "Error",
          message: "Error al cargar la página de creación de membresía."
      });
    }
  },
};

export { MembershipController };