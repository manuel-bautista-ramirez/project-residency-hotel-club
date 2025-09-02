// controllers/createMemberController.js
import { MembershipModel } from "../models/modelMembership.js";
import { generarQRArchivo } from "../utils/qrGenerator.js";
import { sendEmail } from "../utils/nodeMailer.js";

const MembershipController = {
  // Crear cliente principal
  async createClient(req, res) {
    try {
      const { nombre_completo, correo, telefono } = req.body;
      const result = await MembershipModel.createClient({
        nombre_completo,
        correo,
        telefono,
      });
      const id_cliente = result.id_cliente || result.insertId;
      if (!id_cliente) throw new Error("No se pudo obtener el ID del cliente");
      res.json({ id_cliente });
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
        integrantes, // array de nombres (strings) o de objetos { nombre_completo, id_relacion? }
      } = req.body;

      // 1️⃣ Crear contrato en membresias
      const id_membresia = await MembershipModel.createMembershipContract({
        id_cliente,
        id_tipo_membresia,
        fecha_inicio,
        fecha_fin,
      });

      // 2️⃣ Activar membresía
      const id_activa = await MembershipModel.activateMembership({
        id_cliente,
        id_membresia,
        fecha_inicio,
        fecha_fin,
        precio_final,
      });

      // 3️⃣ Registrar integrantes (si es familiar)
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

      // 4️⃣ Obtener datos para el correo/QR
      const cliente = await MembershipModel.getClienteById(id_cliente);
      const tipo = await MembershipModel.getTipoMembresiaById(id_tipo_membresia);
      const integrantesDB = await MembershipModel.getIntegrantesByActiva(id_activa);

      // 5️⃣ Armar payload del QR (titular + fechas + tipo + integrantes si hay)
      const payloadQR = {
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

      // 6️⃣ Generar archivo PNG del QR
      const qrPath = await generarQRArchivo(
        payloadQR,
        `membresia_${id_membresia}.png`
      );

      // 7️⃣ Enviar correo (si el titular tiene correo)
      if (cliente?.correo) {
        await sendEmail({
          to: cliente.correo,
          subject: "Tu Membresía y Código QR",
          titularNombre: cliente.nombre_completo,
          tipoMembresia: tipo?.nombre || "N/D",
          fechaInicio: fecha_inicio,
          fechaFin: fecha_fin,
          qrPath,
          integrantes: integrantesDB, // para renderizar la lista en el correo
        });
      }

      // 8️⃣ Continuar con tu flujo
      res.redirect("/memberships/membershipList");
    } catch (err) {
      console.error("Error en createMembership:", err);
      res.status(500).send("Error al crear la membresía");
    }
  },

  async getTipoMembresiaById(req, res) {
    try {
      const { id } = req.params;
      const tipo = await MembershipModel.getTipoMembresiaById(id);
      if (!tipo) return res.status(404).json({ error: "Membresía no encontrada" });
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

