// controllers/createMemberController.js
import { ClientService } from "../services/clientService.js";
import { MembershipService } from "../services/membershipService.js";
import { MembershipModel } from "../models/modelMembership.js";

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
      } = req.body;

      // 1️⃣ Crear contrato en membresias
      const id_membresia = await MembershipService.createMembershipContract({
        id_cliente,
        id_tipo_membresia,
        fecha_inicio,
        fecha_fin,
      });

      // 2️⃣ Activar membresía
      const id_activa = await MembershipService.activateMembership({
        id_cliente,
        id_membresia,
        fecha_inicio,
        fecha_fin,
        precio_final,
      });

      // 3️⃣ Registrar integrantes (si es familiar)
      await MembershipService.addFamilyMembers(id_activa, integrantes);

      // 4️⃣ Obtener datos para el correo/QR
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

      // 6️⃣ Generar archivo PNG del QR (ahora usando el servicio)
      const qrPath = await MembershipService.generateQRCode(
        payloadQR,
        id_membresia
      );

      // 7️⃣ Enviar correo (si el titular tiene correo)
      await MembershipService.sendMembershipEmail(
        cliente,
        tipo,
        fecha_inicio,
        fecha_fin,
        qrPath,
        integrantesDB
      );

      // 8️⃣ Decidir cómo responder basado en el tipo de petición
      if (req.xhr || req.headers.accept.includes("application/json")) {
        res.json({
          success: true,
          message: "Membresía creada exitosamente",
          id_membresia: id_membresia,
        });
      } else {
        res.redirect("/memberships/listMembership");
        
      }
    } catch (err) {
      console.error("Error en createMembership:", err);

      if (req.xhr || req.headers.accept.includes("application/json")) {
        res.status(500).json({
          success: false,
          message: "Error al crear la membresía",
          error: err.message,
        });
      } else {
        res.status(500).send("Error al crear la membresía");
      }
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
      const precioFamiliar = await MembershipModel.getPrecioFamiliar?.();

      res.render("membershipCreate", {
        title: "Crear Membresía",
        showFooter: true,
        isAdmin,
        userRole,
        tiposMembresia,
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
