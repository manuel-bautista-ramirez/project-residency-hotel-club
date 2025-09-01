import { MembershipModel } from "../models/modelMembership.js";
import { generarQR } from "../utils/qrGenerator.js";
import { sendEmail } from "../utils/nodeMailer.js";

const MembershipController = {
  // Crear cliente principal (queda igual)
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
        integrantes,
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
        const integrantesData = integrantes.map((nombre) => ({
          nombre_completo: nombre,
          id_relacion: null,
        }));
        await MembershipModel.addFamilyMembers(id_activa, integrantesData);
      }

      // 🔹 4️⃣ Obtener datos del cliente para el correo
      const cliente = await MembershipModel.getClienteById(id_cliente);

      if (cliente && cliente.correo) {
        // 🔹 5️⃣ Generar QR con nombre + fecha fin
        const dataQR = `Cliente: ${cliente.nombre_completo}\nExpira: ${fecha_fin}\nMembresía ID: ${id_membresia}`;
        const qrDataUrl = await generarQR(dataQR);

        // 🔹 6️⃣ Enviar correo con QR
        await sendEmail(
          {
            to: cliente.correo,
            subject: "Tu Membresía y Código QR",
            text: "Tu membresía ha sido activada.",
            qrPath: qrDataUrl,
          }
        );
      }

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
      if (!tipo)// Primero autenticación (todos deben estar logueados)
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
      const precioFamiliar = await MembershipModel.getPrecioFamiliar();

      // Pasa baseUrl para evitar problemas con el prefijo de router
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
