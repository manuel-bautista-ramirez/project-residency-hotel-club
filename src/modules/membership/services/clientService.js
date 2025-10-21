/**
 * @file clientService.js
 * @description Servicio que encapsula la lógica de negocio relacionada con los clientes.
 * @module services/ClientService
 */
import { MembershipModel } from "../models/modelMembership.js";

/**
 * Objeto de servicio para las operaciones de clientes.
 * @type {object}
 */
export const ClientService = {
  /**
   * Orquesta la creación de un nuevo cliente.
   * Llama al modelo para insertar el cliente en la base de datos y valida el resultado.
   * @async
   * @param {object} clientData - Los datos del cliente a crear.
   * @param {string} clientData.nombre_completo - Nombre completo del cliente.
   * @param {string} clientData.correo - Correo electrónico del cliente.
   * @param {string} clientData.telefono - Número de teléfono del cliente.
   * @returns {Promise<{id_cliente: number}>} Un objeto que contiene el ID del cliente recién creado.
   * @throws {Error} Si no se pudo obtener un ID de cliente válido después de la inserción.
   */
  async createClient(clientData) {
    const { nombre_completo, correo, telefono } = clientData;
    
    // Delega la operación de base de datos al modelo.
    const result = await MembershipModel.createClient({
      nombre_completo,
      correo,
      telefono,
    });
    
    // Valida la respuesta del modelo para asegurar que se obtuvo un ID.
    const id_cliente = result.id_cliente || result.insertId;
    if (!id_cliente) throw new Error("No se pudo obtener el ID del cliente");
    
    // Devuelve solo la información necesaria al controlador.
    return { id_cliente };
  },

  /**
   * Verifica el estado de un cliente basado en su correo o teléfono.
   * @async
   * @param {object} identifiers - Los identificadores del cliente.
   * @param {string} identifiers.correo - Correo electrónico del cliente.
   * @param {string} identifiers.telefono - Número de teléfono del cliente.
   * @returns {Promise<object>} Un objeto con el estado del cliente: { status: 'active' | 'inactive' | 'not_found' }.
   */
  async checkClientStatus(identifiers) {
    const { correo, telefono } = identifiers;

    const clientStatus = await MembershipModel.findClientAndMembershipStatus(correo, telefono);

    // Caso 1: El cliente no existe O el cliente existe pero nunca ha tenido una membresía (estado es null).
    // En ambos casos, el flujo de creación debe continuar.
    if (!clientStatus || !clientStatus.estado) {
      return { status: 'not_found' };
    }

    // Caso 2: El cliente tiene una membresía activa.
    if (clientStatus.estado === 'Activa') {
      return { status: 'active' };
    }

    // Caso 3: El cliente tiene una membresía inactiva, vencida, etc.
    return { status: 'inactive', id_activa: clientStatus.id_activa };
  }
};