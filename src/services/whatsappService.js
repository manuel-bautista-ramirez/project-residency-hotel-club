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

  async initializeConnection() {
    if (this.isInitializing) {
      console.log('⚠️ Conexión ya en proceso, evitando duplicados...');
      return;
    }
    
    this.isInitializing = true;
    
    try {
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
          
          console.log('📱 Conexión cerrada debido a:', lastDisconnect?.error, ', reconectando:', shouldReconnect);
          
          // Si es error 401 (Unauthorized), limpiar sesión
          if (statusCode === 401) {
            console.log('🧹 Error 401 detectado - Limpiando sesión corrupta...');
            try {
              if (fs.existsSync(this.sessionPath)) {
                fs.rmSync(this.sessionPath, { recursive: true, force: true });
                console.log('✅ Sesión limpiada, reiniciando autenticación...');
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
      
      console.log(`\n📱 CÓDIGO QR GENERADO PARA WHATSAPP (Intento ${this.qrRetryCount}/${this.maxQrRetries})`);
      
      // Generar QR en terminal (ASCII)
      const qrTerminal = await QRCode.toString(qr, { type: 'terminal', small: true });
      console.log(qrTerminal);
      
      // Generar QR como imagen PNG para el navegador
      const qrImagePath = path.join('./public', 'whatsapp-qr.png');
      await QRCode.toFile(qrImagePath, qr, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 INSTRUCCIONES PARA CONECTAR WHATSAPP:');
      console.log('1. Abre WhatsApp en tu teléfono');
      console.log('2. Ve a Configuración > Dispositivos vinculados');
      console.log('3. Toca "Vincular un dispositivo"');
      console.log('4. Escanea el código QR de arriba');
      console.log('5. O visita: http://localhost:3000/whatsapp-qr');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Configurar timeout para QR (30 segundos)
      setTimeout(() => {
        if (this.qrCode === qr && !this.isConnected) {
          console.log('⏰ Código QR expirado. Generando nuevo código...');
          
          if (this.qrRetryCount >= this.maxQrRetries) {
            console.log(`❌ Máximo de intentos alcanzado (${this.maxQrRetries}). Reiniciando conexión...`);
            this.qrRetryCount = 0;
            setTimeout(() => this.initializeConnection(), 3000);
          }
        }
      }, 30000);
      
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

  // Método para enviar comprobante de membresía con PDF en memoria
  async enviarComprobanteMembresía(telefono, membershipData, pdfBuffer) {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp no está conectado');
      }

      const { clienteNombre, numeroMembresia, tipoMembresia, fechaVencimiento, total } = membershipData;

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
      if (pdfBuffer) {
        await this.socket.sendMessage(jid, {
          document: pdfBuffer,
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
