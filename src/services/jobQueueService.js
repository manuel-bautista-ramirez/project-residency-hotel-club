import { executeQuery } from '../dataBase/connectionDataBase.js';
import connectivityService from './connectivityService.js';
import whatsappService from './whatsappService.js'; // Servicio deshabilitado
import emailService from './emailService.js';

class JobQueueService {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = 30000; // Procesar la cola cada 30 segundos
  }

  /**
   * Agrega una nueva tarea a la cola de trabajos.
   * @param {string} service - El servicio que debe ejecutar la tarea (ej: 'whatsapp', 'email').
   * @param {object} payload - Los datos necesarios para ejecutar la tarea.
   */
  async addJob(service, payload) {
    try {
      const query = `
        INSERT INTO job_queue (service, payload, status)
        VALUES (?, ?, 'pending')
      `;
      const params = [service, JSON.stringify(payload)];
      await executeQuery(query, params);
      console.log(`[JobQueue] Nueva tarea agregada para el servicio: ${service}`);
      
      // Intentar procesar inmediatamente si hay conexión
      if (connectivityService.isInternetConnected()) {
        this.processQueue();
      }

    } catch (error) {
      console.error('[JobQueue] Error al agregar la tarea a la cola:', error);
    }
  }

  /**
   * Inicia el procesamiento periódico de la cola de trabajos.
   */
  startProcessing() {
    console.log('[JobQueue] Servicio de cola iniciado. Verificando tareas pendientes cada 30 segundos.');
    setInterval(() => this.processQueue(), this.processingInterval);
    // Procesar la cola una vez al iniciar, por si quedaron tareas pendientes
    setTimeout(() => this.processQueue(), 5000); 
  }

  /**
   * Procesa las tareas pendientes en la cola si hay conexión a Internet.
   */
  async processQueue() {
    if (this.isProcessing) {
      console.log('[JobQueue] El procesamiento ya está en curso.');
      return;
    }

    if (!connectivityService.isInternetConnected()) {
      console.log('[JobQueue] Sin conexión a Internet. El procesamiento se pospone.');
      return;
    }

    this.isProcessing = true;
    console.log('[JobQueue] Buscando tareas pendientes...');

    try {
      const pendingJobs = await executeQuery("SELECT * FROM job_queue WHERE status = 'pending' OR status = 'failed' ORDER BY created_at ASC");

      if (pendingJobs.length === 0) {
        console.log('[JobQueue] No hay tareas pendientes.');
        return;
      }

      console.log(`[JobQueue] Se encontraron ${pendingJobs.length} tareas pendientes. Procesando...`);

      for (const job of pendingJobs) {
        await this.executeJob(job);
      }

    } catch (error) {
      console.error('[JobQueue] Error al procesar la cola de tareas:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Ejecuta una tarea específica y actualiza su estado en la base de datos.
   * @param {object} job - El objeto de la tarea desde la base de datos.
   */
  async executeJob(job) {
    await executeQuery("UPDATE job_queue SET status = 'processing', last_attempt_at = NOW(), attempts = attempts + 1 WHERE id = ?", [job.id]);
    
    let payload;
    // Verificar si el payload es una cadena que necesita ser parseada
    if (typeof job.payload === 'string') {
      try {
        payload = JSON.parse(job.payload);
      } catch (parseError) {
        console.error(`[JobQueue] Tarea #${job.id} descartada: Payload con formato JSON inválido.`, job.payload);
        await executeQuery("UPDATE job_queue SET status = 'failed', error_message = ? WHERE id = ?", ['Invalid JSON payload', job.id]);
        return; // No continuar con esta tarea
      }
    } else {
      // Si ya es un objeto, usarlo directamente
      payload = job.payload;
    }

    try {
      // --- VERIFICACIÓN DE SERVICIO LISTO ---
      if (job.service.startsWith('whatsapp_') && !whatsappService.isConnected) {
        console.log(`[JobQueue] WhatsApp no está listo (deshabilitado). Procesando tarea #${job.id} con servicio deshabilitado.`);
        // Continuar con el procesamiento usando el servicio deshabilitado
      }

      let result;

      switch (job.service) {
        case 'whatsapp_renta':
          result = await whatsappService.enviarComprobanteRenta(payload.telefono, payload.rentData, payload.pdfPath);
          break;
        case 'whatsapp_membresia':
          result = await whatsappService.enviarComprobanteMembresía(payload.telefono, payload.membershipData, payload.pdfPath);
          break;
        case 'email':
          // El payload para el email son directamente las mailOptions
          result = await emailService.send(payload);
          break;
        default:
          throw new Error(`Servicio desconocido en la cola de trabajos: ${job.service}`);
      }

      if (result && result.success) {
        await executeQuery("UPDATE job_queue SET status = 'completed' WHERE id = ?", [job.id]);
        console.log(`[JobQueue] Tarea #${job.id} (${job.service}) completada exitosamente.`);
      } else {
        throw new Error(result.error || 'La tarea falló sin un mensaje de error específico');
      }

    } catch (error) {
      console.error(`[JobQueue] Error al ejecutar la tarea #${job.id}:`, error.message);
      await executeQuery("UPDATE job_queue SET status = 'failed', error_message = ? WHERE id = ?", [error.message, job.id]);
    }
  }
}

const jobQueueService = new JobQueueService();
export default jobQueueService;
