import { MembershipModel } from "../models/modelMembership.js";

export const MembershipController = {
  async createClient(req, res) {
    try {
      const { name, phone, email } = req.body;
      const id_cliente = await MembershipModel.createClient({
        name,
        phone,
        email,
      });
      // Devuelve un objeto, no solo el número
      res.json({ id_cliente });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al crear el cliente" });
    }
  },

  async createMembership(req, res) {
    try {
      const {
        id_cliente,
        id_tipo_membresia,
        integrantes, // puede venir como array/objeto
        fecha_inicio,
        fecha_fin,
        precio_final,
      } = req.body;

      // 1) Crear contrato
      const id_membresia = await MembershipModel.createMembershipContract({
        id_cliente,
        id_tipo_membresia,
        fecha_inicio,
        fecha_fin,
      });

      // 2) (Opcional) Registrar integrantes si los hay
      if (integrantes) {
        // Normaliza a array
        const list = Array.isArray(integrantes)
          ? integrantes
          : Object.values(integrantes); // por si vienen como integrantes[0], integrantes[1], ...
        if (list.length > 0) {
          await MembershipModel.addFamilyMembers(id_membresia, list);
        }
      }

      // 3) (Opcional) Activar (si tu flujo activa de inmediato)
      // const id_activa = await MembershipModel.activateMembership({
      //   id_cliente, id_membresia, fecha_inicio, fecha_fin, precio_final
      // });

      // Redirige a tu lista correcta
      res.redirect("/membership/listMembership");
    } catch (err) {
      console.error(err);
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
