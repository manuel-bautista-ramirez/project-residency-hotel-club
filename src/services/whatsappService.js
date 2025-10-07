import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

class WhatsAppService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.qrCode = null;
    this.sessionPath = './whatsapp_session';
    this.userInfo = null;
    this.qrRetryCount = 0;
    this.maxQrRetries = 3;
    this.isInitializing = false;
    this.onReadyCallbacks = [];
    
    // Inicializar conexión después de un delay
    setTimeout(() => this.initializeConnection(), 3000);
  }

  /**
   * Verifica si existe un archivo de credenciales de sesión.
   * @returns {boolean} - True si la sesión existe, false en caso contrario.
   */
  sessionExists() {
    const credsPath = path.join(this.sessionPath, 'creds.json');
    return fs.existsSync(credsPath);
  }

  async initializeConnection() {
    if (this.isInitializing) {
      console.log('⚠️ Conexión ya en proceso, evitando duplicados...');
      return;
    }
    
    this.isInitializing = true;
    
    try {
      console.log('🔍 Verificando estado de la sesión de WhatsApp...');

      // Notificar si no hay sesión guardada y luego iniciar la conexión
      if (!this.sessionExists()) {
        console.log('🟡 No se encontró una sesión de WhatsApp guardada. Se generará un código QR.');
      } else {
        console.log('✅ Sesión de WhatsApp encontrada. Intentando conectar...');
      }

      console.log('🔄 Iniciando conexión a WhatsApp...');
      
      // Crear directorio de sesión si no existe
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      // Obtener estado de autenticación
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // Crear socket de WhatsApp con logger completo
      const logger = {
        level: 'silent',
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        trace: () => {},
        fatal: () => {},
        child: () => ({
          level: 'silent',
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          trace: () => {},
          fatal: () => {},
          child: () => ({ 
            level: 'silent', 
            debug: () => {}, 
            info: () => {}, 
            warn: () => {}, 
            error: () => {},
            trace: () => {},
            fatal: () => {}
          })
        })
      };

      this.socket = makeWASocket({
        auth: state,
        logger: logger
      });

      // Manejar eventos de conexión
      this.socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.handleQRCode(qr);
        }

        if (connection === 'close') {
          this.isConnected = false;
          this.qrCode = null;
          this.isInitializing = false;
          
          const statusCode = (lastDisconnect?.error)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
         // console.log('📱 Conexión cerrada debido a:', lastDisconnect?.error, ', reconectando:', shouldReconnect);
          
          // Si es error 401 (Unauthorized), limpiar sesión
          if (statusCode === 401) {
            console.log('🧹 Error 401 detectado - Limpiando sesión corrupta...');
            try {
              if (fs.existsSync(this.sessionPath)) {
                fs.rmSync(this.sessionPath, { recursive: true, force: true });
                console.log('✅ Sesión limpiada, reiniJciando autenticación...');
              }
            } catch (cleanError) {
              console.error('❌ Error limpiando sesión:', cleanError);
            }
          }
          
          if (shouldReconnect) {
            setTimeout(() => this.initializeConnection(), 5000);
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.qrCode = null;
          this.qrRetryCount = 0;
          this.isInitializing = false;
          
          console.log('\n🎉 ¡WHATSAPP CONECTADO EXITOSAMENTE!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ Tu WhatsApp está ahora vinculado y listo para enviar mensajes');
          console.log('📱 El sistema enviará automáticamente los comprobantes por WhatsApp');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          // Obtener información del usuario conectado
          this.getUserInfo();
          
          this.onReadyCallbacks.forEach(callback => callback());
          this.onReadyCallbacks = [];
        } else if (connection === 'connecting') {
          console.log('🔄 Conectando a WhatsApp...');
        }
      });

      // Guardar credenciales cuando se actualicen
      this.socket.ev.on('creds.update', saveCreds);

    } catch (error) {
      console.error('❌ Error inicializando WhatsApp:', error);
      this.isInitializing = false;
    }
  }

  async handleQRCode(qr) {
    try {
      this.qrCode = qr;
      this.qrRetryCount++;

      // 1. Generar la imagen del QR para la web
      const qrImagePath = path.join('./public', 'whatsapp-qr.png');
      await QRCode.toFile(qrImagePath, qr, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      // 2. Construir el mensaje para la consola (sin QR de texto)
      const output = [
        '📱 CÓDIGO QR REQUERIDO PARA VINCULAR WHATSAPP (Intento ' + this.qrRetryCount + '/' + this.maxQrRetries + ')',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'El código QR ya no se muestra en la terminal.',
        'Por favor, abre tu navegador y ve a la siguiente dirección para escanearlo:',
        '',
        '    http://localhost:3000/whatsapp-qr',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'INSTRUCCIONES:',
        '1. Abre la URL de arriba en tu navegador.',
        '2. Abre WhatsApp en tu teléfono.',
        '3. Ve a Configuración > Dispositivos vinculados.',
        '4. Toca "Vincular un dispositivo" y escanea el QR que aparece en el navegador.',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
      ].join('\n');

      // 3. Limpiar la consola y mostrar el mensaje
      console.clear();
      console.log(output);

      // 4. Configurar timeout para reintentos
      setTimeout(() => {
        if (this.qrCode === qr && !this.isConnected) {
          if (this.qrRetryCount >= this.maxQrRetries) {
            console.log(`❌ Máximo de intentos (${this.maxQrRetries}) alcanzado. Reiniciando el ciclo de conexión...`);
            this.qrRetryCount = 0; // Reiniciar contador para el nuevo ciclo
            this.socket.end(new Error('QR Max Retries')); // Forzar cierre y reconexión completa
          }
        }
      }, 30000); // 30 segundos de vida para el QR

    } catch (error) {
      console.error('❌ Error manejando QR:', error);
    }
  }

  async getUserInfo() {
    try {
      if (this.socket && this.isConnected) {
        const userInfo = this.socket.user;
        this.userInfo = userInfo;
        
        console.log('👤 INFORMACIÓN DEL USUARIO CONECTADO:');
        console.log(`📱 Teléfono: ${userInfo.id.split(':')[0]}`);
        console.log(`👤 Nombre: ${userInfo.name || 'No disponible'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
    } catch (error) {
      console.error('❌ Error obteniendo información del usuario:', error);
    }
  }

  // Método principal para enviar comprobante de renta con PDF
  async enviarComprobanteRenta(telefono, rentData, pdfPath) {
    try {
      if (!this.isConnected) {
        console.log('⚠️ WhatsApp no está conectado');
        return { success: false, error: 'WhatsApp no conectado' };
      }

      const jid = this.formatPhoneNumber(telefono);
      
      const isReservation = (rentData?.type === 'reservation');
      const titulo = isReservation ? 'COMPROBANTE DE RESERVACIÓN' : 'COMPROBANTE DE RENTA';
      const estadoLinea = isReservation ? '✅ *Reservación Confirmada*' : '✅ *Renta Registrada*';
      const mensaje = `🏨 *${titulo}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${estadoLinea}
📋 *Número:* #${rentData.id}
👤 *Cliente:* ${rentData.client_name}
🏠 *Habitación:* #${rentData.room_number}

📅 *Check-in:* ${rentData.check_in ? new Date(rentData.check_in).toLocaleDateString('es-MX') : '—'}
📅 *Check-out:* ${rentData.check_out ? new Date(rentData.check_out).toLocaleDateString('es-MX') : '—'}
💰 *Total:* $${parseFloat(rentData.total || 0).toFixed(2)} MXN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 *Comprobante Digital con QR*
🔍 Escanea el código QR para verificar

🏨 *Hotel Residency Club*
📞 Cualquier duda, contáctanos

¡Gracias por elegirnos! 🌟`;

      if (pdfPath && fs.existsSync(pdfPath)) {
        // Enviar PDF con mensaje
        const pdfBuffer = fs.readFileSync(pdfPath);
        
        const outFileName = isReservation 
          ? `Comprobante_Reservacion_${rentData.id}.pdf`
          : `Comprobante_Renta_${rentData.id}.pdf`;
        await this.socket.sendMessage(jid, {
          document: pdfBuffer,
          mimetype: 'application/pdf',
          fileName: outFileName,
          caption: mensaje
        });
        
        console.log(`✅ Comprobante PDF enviado a ${telefono}`);
      } else {
        // Fallback: enviar solo texto si no hay PDF
        await this.socket.sendMessage(jid, { text: mensaje });
        console.log(`⚠️ PDF no encontrado, enviado solo texto a ${telefono}`);
      }

      return { success: true, message: 'Comprobante enviado exitosamente' };

    } catch (error) {
      console.error('❌ Error enviando comprobante de renta:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para enviar comprobante de membresía
  async enviarComprobanteMembresía(telefono, clienteNombre, numeroMembresia, tipoMembresia, fechaVencimiento, total, pdfPath) {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp no está conectado');
      }

      const mensaje = `🏆 *COMPROBANTE DE MEMBRESÍA*\n\n` +
                     `👤 Cliente: ${clienteNombre}\n` +
                     `🎫 Membresía: #${numeroMembresia}\n` +
                     `📋 Tipo: ${tipoMembresia}\n` +
                     `📅 Vencimiento: ${fechaVencimiento}\n` +
                     `💰 Total: $${total}\n\n` +
                     `¡Bienvenido al club! 🎉`;

      const jid = this.formatPhoneNumber(telefono);
      
      // Enviar mensaje de texto
      await this.socket.sendMessage(jid, { text: mensaje });
      
      // Enviar PDF si existe
      if (pdfPath && fs.existsSync(pdfPath)) {
        await this.socket.sendMessage(jid, {
          document: fs.readFileSync(pdfPath),
          fileName: `Comprobante_Membresia_${numeroMembresia}.pdf`,
          mimetype: 'application/pdf'
        });
      }

      console.log(`✅ Comprobante de membresía enviado a ${telefono}`);
      return { success: true, message: 'Comprobante enviado exitosamente' };

    } catch (error) {
      console.error('❌ Error enviando comprobante de membresía:', error);
      return { success: false, error: error.message };
    }
  }

  // Método genérico para enviar cualquier mensaje con PDF
  async enviarMensajeConPDF(telefono, mensaje, pdfPath, nombreArchivo) {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp no está conectado');
      }

      const jid = this.formatPhoneNumber(telefono);
      
      // Enviar mensaje de texto
      await this.socket.sendMessage(jid, { text: mensaje });
      
      // Enviar PDF si existe
      if (pdfPath && fs.existsSync(pdfPath)) {
        await this.socket.sendMessage(jid, {
          document: fs.readFileSync(pdfPath),
          fileName: nombreArchivo || 'documento.pdf',
          mimetype: 'application/pdf'
        });
      }

      console.log(`✅ Mensaje con PDF enviado a ${telefono}`);
      return { success: true, message: 'Mensaje enviado exitosamente' };

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      return { success: false, error: error.message };
    }
  }

  // Formatear número de teléfono para WhatsApp
  formatPhoneNumber(phone) {
    // Remover caracteres no numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Si el número tiene 10 dígitos y no empieza con 52, agregar código de país
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('52')) {
      cleanPhone = '52' + cleanPhone;
    }
    
    return cleanPhone + '@s.whatsapp.net';
  }

  // Obtener estado de conexión
  getStatus() {
    return {
      connected: this.isConnected,
      qrCode: this.qrCode,
      userInfo: this.userInfo,
      retryCount: this.qrRetryCount
    };
  }

  // Esperar a que WhatsApp esté listo
  async waitForReady() {
    return new Promise((resolve) => {
      if (this.isConnected) {
        resolve();
      } else {
        this.onReadyCallbacks.push(resolve);
      }
    });
  }
}

// Crear instancia única (singleton)
const whatsappService = new WhatsAppService();

export default whatsappService;
