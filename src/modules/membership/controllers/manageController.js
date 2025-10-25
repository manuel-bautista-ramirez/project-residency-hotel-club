/**
 * @file manageController.js
 * @description Controlador para la gestión de configuraciones de membresías.
 * @module controllers/manageController
 */

import { ManageModel } from "../models/modelManage.js";

class ManageController {
  /**
   * Obtiene todos los tipos de membresía y los devuelve como JSON.
   */
  async getAllTiposMembresia(req, res) {
    try {
      const tipos = await ManageModel.getTiposMembresia();
      res.status(200).json(tipos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener los tipos de membresía.", error: error.message });
    }
  }

  /**
   * Crea un nuevo tipo de membresía.
   */
  async createTipoMembresia(req, res) {
    try {
      const nuevoTipo = await ManageModel.createTipoMembresia(req.body);
      res.status(201).json({ message: "Tipo de membresía creado con éxito.", data: nuevoTipo });
    } catch (error) {
      res.status(500).json({ message: "Error al crear el tipo de membresía.", error: error.message });
    }
  }

  /**
   * Actualiza un tipo de membresía existente.
   */
  async updateTipoMembresia(req, res) {
    try {
      const { id } = req.params;
      const updated = await ManageModel.updateTipoMembresia(id, req.body);
      if (updated) {
        res.status(200).json({ message: "Tipo de membresía actualizado con éxito." });
      } else {
        res.status(404).json({ message: "Tipo de membresía no encontrado." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar el tipo de membresía.", error: error.message });
    }
  }

  /**
   * Elimina un tipo de membresía.
   */
  async deleteTipoMembresia(req, res) {
    try {
      const { id } = req.params;
      const deleted = await ManageModel.deleteTipoMembresia(id);
      if (deleted) {
        res.status(200).json({ message: "Tipo de membresía eliminado con éxito." });
      } else {
        res.status(404).json({ message: "Tipo de membresía no encontrado." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar el tipo de membresía.", error: error.message });
    }
  }

  // --- MÉTODOS DE PAGO ---

  /**
   * Obtiene todos los métodos de pago.
   */
  async getAllMetodosPago(req, res) {
    try {
      const metodos = await ManageModel.getMetodosPago();
      res.status(200).json(metodos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener los métodos de pago.", error: error.message });
    }
  }

  /**
   * Crea un nuevo método de pago.
   */
  async createMetodoPago(req, res) {
    try {
      const nuevoMetodo = await ManageModel.createMetodoPago(req.body);
      res.status(201).json({ message: "Método de pago creado con éxito.", data: nuevoMetodo });
    } catch (error) {
      res.status(500).json({ message: "Error al crear el método de pago.", error: error.message });
    }
  }

  /**
   * Actualiza un método de pago existente.
   */
  async updateMetodoPago(req, res) {
    try {
      const { id } = req.params;
      const updated = await ManageModel.updateMetodoPago(id, req.body);
      if (updated) {
        res.status(200).json({ message: "Método de pago actualizado con éxito." });
      } else {
        res.status(404).json({ message: "Método de pago no encontrado." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar el método de pago.", error: error.message });
    }
  }

  /**
   * Elimina un método de pago.
   */
  async deleteMetodoPago(req, res) {
    try {
      const { id } = req.params;
      const deleted = await ManageModel.deleteMetodoPago(id);
      if (deleted) {
        res.status(200).json({ message: "Método de pago eliminado con éxito." });
      } else {
        res.status(404).json({ message: "Método de pago no encontrado." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar el método de pago.", error: error.message });
    }
  }
}

export const manageController = new ManageController();
