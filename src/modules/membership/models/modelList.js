// models/modelList.js
import { pool } from "../../../dataBase/connectionDataBase.js";

const modelList = {
  // Obtener todas las membresías activas con información de clientes
  async getMembresiasActivas() {
    try {
      const query = `
        SELECT 
          ma.id_activa,
          ma.id_cliente,
          ma.id_membresia,
          ma.fecha_inicio,
          ma.fecha_fin,
          ma.precio_final,
          ma.estado,
          ma.qr_path,
          c.nombre_completo,
          c.telefono,
          c.correo,
          tm.nombre as tipo_membresia,
          tm.max_integrantes,
          DATEDIFF(ma.fecha_fin, CURDATE()) as dias_restantes,
          CASE 
            WHEN tm.max_integrantes > 1 THEN 'Familiar'
            ELSE 'Individual'
          END as tipo,
          (SELECT COUNT(*) FROM integrantes_membresia im WHERE im.id_activa = ma.id_activa) as total_integrantes
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.estado = 'Activa'
        ORDER BY ma.fecha_fin ASC
      `;

      const [membresias] = await pool.query(query);

      // Para cada membresía, obtener los integrantes si es familiar
      for (let membresia of membresias) {
        if (membresia.max_integrantes > 1) {
          membresia.integrantes = await this.getIntegrantesMembresia(
            membresia.id_activa
          );
        } else {
          membresia.integrantes = [];
        }
      }

      return membresias;
    } catch (error) {
      console.error("Error al obtener membresías activas:", error);
      throw error;
    }
  },

  // Obtener integrantes de una membresía familiar (SIMPLIFICADO)
  async getIntegrantesMembresia(id_activa) {
    try {
      const query = `
        SELECT 
          id_integrante,
          nombre_completo
        FROM integrantes_membresia
        WHERE id_activa = ?
        ORDER BY id_integrante
      `;

      const [integrantes] = await pool.query(query, [id_activa]);
      return integrantes;
    } catch (error) {
      console.error("Error al obtener integrantes:", error);
      throw error;
    }
  },

  // Obtener membresías por tipo (Individual/Familiar)
  async getMembresiasPorTipo(tipo) {
    try {
      const esFamiliar = tipo === "Familiar";

      const query = `
        SELECT 
          ma.id_activa,
          ma.id_cliente,
          ma.id_membresia,
          ma.fecha_inicio,
          ma.fecha_fin,
          ma.precio_final,
          ma.estado,
          c.nombre_completo,
          c.telefono,
          c.correo,
          tm.nombre as tipo_membresia,
          tm.max_integrantes,
          DATEDIFF(ma.fecha_fin, CURDATE()) as dias_restantes,
          (SELECT COUNT(*) FROM integrantes_membresia im WHERE im.id_activa = ma.id_activa) as total_integrantes
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.estado = 'Activa' 
          AND tm.max_integrantes ${esFamiliar ? ">" : "="} 1
        ORDER BY ma.fecha_fin ASC
      `;

      const [membresias] = await pool.query(query);

      // Para membresías familiares, obtener integrantes
      if (esFamiliar) {
        for (let membresia of membresias) {
          membresia.integrantes = await this.getIntegrantesMembresia(
            membresia.id_activa
          );
        }
      }

      return membresias;
    } catch (error) {
      console.error("Error al obtener membresías por tipo:", error);
      throw error;
    }
  },

  // Obtener membresías por estado (Activa, Por vencer, Vencida)
  async getMembresiasPorEstado(estado) {
    try {
      let condition = "";

      switch (estado) {
        case "Activa":
          condition = "AND DATEDIFF(ma.fecha_fin, CURDATE()) > 7";
          break;
        case "Por vencer":
          condition = "AND DATEDIFF(ma.fecha_fin, CURDATE()) BETWEEN 1 AND 7";
          break;
        case "Vencida":
          condition = "AND DATEDIFF(ma.fecha_fin, CURDATE()) <= 0";
          break;
        default:
          condition = "";
      }

      const query = `
        SELECT 
          ma.id_activa,
          ma.id_cliente,
          ma.id_membresia,
          ma.fecha_inicio,
          ma.fecha_fin,
          ma.precio_final,
          ma.estado,
          c.nombre_completo,
          c.telefono,
          c.correo,
          tm.nombre as tipo_membresia,
          tm.max_integrantes,
          DATEDIFF(ma.fecha_fin, CURDATE()) as dias_restantes,
          CASE 
            WHEN tm.max_integrantes > 1 THEN 'Familiar'
            ELSE 'Individual'
          END as tipo,
          (SELECT COUNT(*) FROM integrantes_membresia im WHERE im.id_activa = ma.id_activa) as total_integrantes
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.estado = 'Activa'
          ${condition}
        ORDER BY ma.fecha_fin ASC
      `;

      const [membresias] = await pool.query(query);

      // Para cada membresía familiar, obtener los integrantes
      for (let membresia of membresias) {
        if (membresia.max_integrantes > 1) {
          membresia.integrantes = await this.getIntegrantesMembresia(
            membresia.id_activa
          );
        }
      }

      return membresias;
    } catch (error) {
      console.error("Error al obtener membresías por estado:", error);
      throw error;
    }
  },

  // Buscar membresías por nombre, teléfono o correo
  async buscarMembresias(termino) {
    try {
      const query = `
        SELECT 
          ma.id_activa,
          ma.id_cliente,
          ma.id_membresia,
          ma.fecha_inicio,
          ma.fecha_fin,
          ma.precio_final,
          ma.estado,
          c.nombre_completo,
          c.telefono,
          c.correo,
          tm.nombre as tipo_membresia,
          tm.max_integrantes,
          DATEDIFF(ma.fecha_fin, CURDATE()) as dias_restantes,
          CASE 
            WHEN tm.max_integrantes > 1 THEN 'Familiar'
            ELSE 'Individual'
          END as tipo,
          (SELECT COUNT(*) FROM integrantes_membresia im WHERE im.id_activa = ma.id_activa) as total_integrantes
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.estado = 'Activa'
          AND (c.nombre_completo LIKE ? OR c.telefono LIKE ? OR c.correo LIKE ?)
        ORDER BY ma.fecha_fin ASC
      `;

      const searchTerm = `%${termino}%`;
      const [membresias] = await pool.query(query, [
        searchTerm,
        searchTerm,
        searchTerm,
      ]);

      // Para cada membresía familiar, obtener los integrantes
      for (let membresia of membresias) {
        if (membresia.max_integrantes > 1) {
          membresia.integrantes = await this.getIntegrantesMembresia(
            membresia.id_activa
          );
        }
      }

      return membresias;
    } catch (error) {
      console.error("Error al buscar membresías:", error);
      throw error;
    }
  },

  // Obtener estadísticas de membresías
  async getEstadisticasMembresias() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN DATEDIFF(ma.fecha_fin, CURDATE()) > 7 THEN 1 ELSE 0 END) as activas,
          SUM(CASE WHEN DATEDIFF(ma.fecha_fin, CURDATE()) BETWEEN 1 AND 7 THEN 1 ELSE 0 END) as por_vencer,
          SUM(CASE WHEN DATEDIFF(ma.fecha_fin, CURDATE()) <= 0 THEN 1 ELSE 0 END) as vencidas,
          SUM(CASE WHEN tm.max_integrantes > 1 THEN 1 ELSE 0 END) as familiares,
          SUM(CASE WHEN tm.max_integrantes = 1 THEN 1 ELSE 0 END) as individuales,
          SUM(ma.precio_final) as ingresos_totales
        FROM membresias_activas ma
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.estado = 'Activa'
      `;

      const [stats] = await pool.query(query);
      return stats[0];
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      throw error;
    }
  },

  // 🔽 NUEVOS MÉTODOS PARA LA ESTRUCTURA SIMPLIFICADA

  // Obtener detalles completos de una membresía
  async getMembresiaDetalles(id_activa) {
    try {
      const query = `
        SELECT 
          ma.id_activa,
          ma.id_cliente,
          ma.id_membresia,
          ma.fecha_inicio,
          ma.fecha_fin,
          ma.precio_final,
          ma.estado,
          ma.qr_path,
          c.nombre_completo,
          c.telefono,
          c.correo,
          tm.nombre as tipo_membresia,
          tm.descripcion,
          tm.max_integrantes,
          DATEDIFF(ma.fecha_fin, CURDATE()) as dias_restantes
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.id_activa = ?
      `;

      const [membresia] = await pool.query(query, [id_activa]);

      if (membresia.length > 0) {
        const membresiaData = membresia[0];

        // Obtener integrantes si es membresía familiar
        if (membresiaData.max_integrantes > 1) {
          membresiaData.integrantes = await this.getIntegrantesMembresia(
            id_activa
          );
        } else {
          membresiaData.integrantes = [];
        }

        // Obtener historial de pagos
        membresiaData.pagos = await this.getPagosMembresia(id_activa);

        // Transformar la ruta del QR a una ruta web relativa
        if (membresiaData.qr_path) {
          const publicPath = '/uploads/';
          const indexOfPublic = membresiaData.qr_path.indexOf(publicPath);
          if (indexOfPublic !== -1) {
            membresiaData.qr_path = membresiaData.qr_path.substring(indexOfPublic);
          }
        }

        return membresiaData;
      }

      return null;
    } catch (error) {
      console.error("Error al obtener detalles de membresía:", error);
      throw error;
    }
  },

  // Obtener pagos de una membresía
  async getPagosMembresia(id_activa) {
    try {
      const query = `
        SELECT 
          p.*,
          mp.nombre as metodo_pago
        FROM pagos p
        INNER JOIN metodos_pago mp ON p.id_metodo_pago = mp.id_metodo_pago
        WHERE p.id_activa = ?
        ORDER BY p.fecha_pago DESC
      `;

      const [pagos] = await pool.query(query, [id_activa]);
      return pagos;
    } catch (error) {
      console.error("Error al obtener pagos de membresía:", error);
      throw error;
    }
  },

  // Cancelar/vencer membresía
  async actualizarEstadoMembresia(id_activa, nuevo_estado) {
    try {
      const query = `
        UPDATE membresias_activas 
        SET estado = ? 
        WHERE id_activa = ?
      `;

      const [result] = await pool.query(query, [nuevo_estado, id_activa]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar estado de membresía:", error);
      throw error;
    }
  },
  async getIntegrantesByMembresia(id_activa) {
    try {
      const query = `
        SELECT 
          nombre_completo
        FROM integrantes_membresia 
        WHERE id_activa = ?
        ORDER BY nombre_completo
      `;
  
      const [rows] = await pool.query(query, [id_activa]);
      return rows;
    } catch (error) {
      console.error("Error en getIntegrantesByMembresia:", error);
      throw error;
    }
  }
};

export { modelList };
