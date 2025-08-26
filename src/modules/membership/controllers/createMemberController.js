 import {MembershipModel} from '../models/modelMembership.js';
 
 //Controladores para enviar datos para CRUD de membresía
 export const MembershipController = {
    //Primero se creara el cliente
    async createClient(req, res) {
      try {
        const { name, phone, email } = req.body;
        const client = await MembershipModel.createClient({ name, phone, email });
        res.json(client);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear el cliente" });
      }
    },
  
    //Segundo se creara la membresia
    async createMembership(req, res) {
      try {
        const { id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, precio_final } = req.body;
        const membership = await MembershipModel.create({ id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, precio_final });
        res.json(membership);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la membresía" });
      }
    },
    //Renderizar los tipos de membresia
    async renderCreate(req, res) {
      try {
        const tiposMembresia = await MembershipModel.getTiposMembresia();
        const precioFamiliar = await MembershipModel.getPrecioFamiliar();
        res.render("membershipCreate", { tiposMembresia, precioFamiliar });
      } catch (error) {
        console.error("Error al cargar tipos de membresía:", error);
        res.status(500).send("Error al cargar tipos de membresía");
      }
    }
  
    // 
  
   
  
  
  
  };