import { pool } from "../../../dataBase/conecctionDataBase.js";

const modelList = {
  // Obtener todas las membresías activas con información de clientes e integrantes
  async getMembresiasActivas() {
    try {
      // Consulta para obtener todas las membresías activas con información del cliente principal
      const query = `
        SELECT 
          ma.id_activa,
          ma.id_cliente,
          ma.id_membresia,
          ma.fecha_inicio,
          ma.fecha_fin,
          ma.precio_final,
          ma.estado,
          ma.qr_code,
          c.nombre_completo,
          c.telefono,
          c.correo,
          tm.nombre as tipo_membresia,
          tm.max_integrantes,
          DATEDIFF(ma.fecha_fin, CURDATE()) as dias_restantes,
          CASE 
            WHEN tm.max_integrantes > 1 THEN 'Familiar'
            ELSE 'Individual'
          END as tipo
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.estado = 'Activa'
        ORDER BY ma.fecha_fin ASC
      `;
      
      const [membresias] = await pool.query(query);
      
      // Para cada membresía familiar, obtener los integrantes
      for (let membresia of membresias) {
        if (membresia.max_integrantes > 1) {
          membresia.integrantes = await this.getIntegrantesMembresia(membresia.id_activa);
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

  // Obtener integrantes de una membresía familiar
  async getIntegrantesMembresia(id_activa) {
    try {
      const query = `
        SELECT 
          im.id_integrante,
          im.id_cliente,
          c.nombre_completo,
          rf.nombre as relacion
        FROM integrantes_membresia im
        INNER JOIN clientes c ON im.id_cliente = c.id_cliente
        LEFT JOIN relaciones_familiares rf ON im.id_relacion = rf.id_relacion
        WHERE im.id_activa = ?
        ORDER BY im.id_integrante
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
      const esFamiliar = tipo === 'Familiar';
      
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
          DATEDIFF(ma.fecha_fin, CURDATE()) as dias_restantes
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.estado = 'Activa' 
          AND tm.max_integrantes ${esFamiliar ? '>' : '='} 1
        ORDER BY ma.fecha_fin ASC
      `;
      
      const [membresias] = await pool.query(query);
      
      // Para membresías familiares, obtener integrantes
      if (esFamiliar) {
        for (let membresia of membresias) {
          membresia.integrantes = await this.getIntegrantesMembresia(membresia.id_activa);
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
      
      switch(estado) {
        case 'Activa':
          condition = "AND DATEDIFF(ma.fecha_fin, CURDATE()) > 7";
          break;
        case 'Por vencer':
          condition = "AND DATEDIFF(ma.fecha_fin, CURDATE()) BETWEEN 1 AND 7";
          break;
        case 'Vencida':
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
          END as tipo
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
          membresia.integrantes = await this.getIntegrantesMembresia(membresia.id_activa);
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
          END as tipo
        FROM membresias_activas ma
        INNER JOIN clientes c ON ma.id_cliente = c.id_cliente
        INNER JOIN membresias m ON ma.id_membresia = m.id_membresia
        INNER JOIN tipos_membresia tm ON m.id_tipo_membresia = tm.id_tipo_membresia
        WHERE ma.estado = 'Activa'
          AND (c.nombre_completo LIKE ? OR c.telefono LIKE ? OR c.correo LIKE ?)
        ORDER BY ma.fecha_fin ASC
      `;
      
      const searchTerm = `%${termino}%`;
      const [membresias] = await pool.query(query, [searchTerm, searchTerm, searchTerm]);
      
      // Para cada membresía familiar, obtener los integrantes
      for (let membresia of membresias) {
        if (membresia.max_integrantes > 1) {
          membresia.integrantes = await this.getIntegrantesMembresia(membresia.id_activa);
        }
      }
      
      return membresias;
    } catch (error) {
      console.error("Error al buscar membresías:", error);
      throw error;
    }
  },

  // Obtener estadísticas de membresías - CORREGIDO
  async getEstadisticasMembresias() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN DATEDIFF(ma.fecha_fin, CURDATE()) > 7 THEN 1 ELSE 0 END) as activas,
          SUM(CASE WHEN DATEDIFF(ma.fecha_fin, CURDATE()) BETWEEN 1 AND 7 THEN 1 ELSE 0 END) as por_vencer,
          SUM(CASE WHEN DATEDIFF(ma.fecha_fin, CURDATE()) <= 0 THEN 1 ELSE 0 END) as vencidas,
          SUM(CASE WHEN tm.max_integrantes > 1 THEN 1 ELSE 0 END) as familiares,
          SUM(CASE WHEN tm.max_integrantes = 1 THEN 1 ELSE 0 END) as individuales
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
  }
};

export { modelList };

