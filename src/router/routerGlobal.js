import express from "express";
import fs from "fs";
import path from "path";
import routerLogin from "../modules/login/routers/routerLogin.js";
import { membershipApiRoutes, membershipRoutes } from "../modules/membership/routes/index.js";
import { routerRoom } from "../modules/rooms/routes/RouteRooms.js";

// Rutas de módulos

// Importar el servicio centralizado de WhatsApp
import whatsappService from '../services/whatsappService.js';

const routerGlobal = express.Router();

// Rutas de módulos
routerGlobal.use(routerLogin);
routerGlobal.use("/memberships", membershipRoutes);
routerGlobal.use("/api/memberships", membershipApiRoutes);
routerGlobal.use(routerRoom);

// Ruta para mostrar QR de WhatsApp en el navegador
routerGlobal.get('/whatsapp-qr', (req, res) => {
  try {
    const status = whatsappService.getStatus();

    if (status.connected) {
      return res.send(`
        <html>
          <head>
            <title>WhatsApp - Conectado</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
              .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
              .success { color: #059669; }
              .icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✅</div>
              <h1 class="success">WhatsApp Conectado</h1>
              <p>Tu WhatsApp está vinculado y funcionando correctamente.</p>
              <p>El sistema enviará automáticamente los comprobantes por WhatsApp.</p>
              ${status.userInfo ? `<p><strong>Usuario:</strong> ${status.userInfo.name}</p>` : ''}
            </div>
          </body>
        </html>
      `);
    }

    const qrImagePath = path.join(process.cwd(), 'public', 'whatsapp-qr.png');

    if (fs.existsSync(qrImagePath)) {
      return res.send(`
        <html>
          <head>
            <title>WhatsApp QR - Escanear</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f0f0f0; }
              .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              .qr-image { max-width: 300px; margin: 20px 0; border: 2px solid #ddd; border-radius: 8px; }
              .instructions { text-align: left; margin: 20px 0; }
              .instructions li { margin: 8px 0; }
              .refresh-btn { background: #25D366; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; }
              .refresh-btn:hover { background: #128C7E; }
            </style>
            <script>
              // Auto-refresh cada 5 segundos
              setTimeout(() => location.reload(), 5000);
            </script>
          </head>
          <body>
            <div class="container">
              <h1>📱 Conectar WhatsApp</h1>
              <img src="/whatsapp-qr.png" alt="QR Code WhatsApp" class="qr-image">

              <div class="instructions">
                <h3>Instrucciones:</h3>
                <ol>
                  <li>Abre WhatsApp en tu teléfono</li>
                  <li>Ve a <strong>Configuración > Dispositivos vinculados</strong></li>
                  <li>Toca <strong>"Vincular un dispositivo"</strong></li>
                  <li>Escanea este código QR</li>
                </ol>
              </div>

              <p><small>⏰ El código expira en 30 segundos y se renovará automáticamente</small></p>
              <button class="refresh-btn" onclick="location.reload()">🔄 Actualizar</button>
            </div>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <head>
            <title>WhatsApp - Conectando</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
              .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
              .loading { color: #666; }
              .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #25D366; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
            <script>
              // Auto-refresh cada 3 segundos
              setTimeout(() => location.reload(), 3000);
            </script>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h1 class="loading">Conectando a WhatsApp...</h1>
              <p>Generando código QR, por favor espera...</p>
              <p><small>Esta página se actualizará automáticamente</small></p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error en ruta whatsapp-qr:', error);
    res.status(500).send('Error al cargar el QR de WhatsApp');
  }
});

// API para obtener estado de WhatsApp en JSON
routerGlobal.get('/api/whatsapp/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado de WhatsApp' });
  }
});


// Middleware para manejar error 404 (después de todas las rutas)
routerGlobal.use((req, res) => {
  res.status(404).render("error404", {
    layout: "main",
    title: "Página no encontrada",
    messengger: "La ruta que estás intentando acceder no existe.",
    url: req.originalUrl,
    showFooter: true,
  });
});

// Middleware para manejar error 500
routerGlobal.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  res.status(500).render("error500", {
    layout: "main",
    title: "500",
    mensaje: "Error interno del servidor",
    errorMessage: isDev ? err.message : null,
    stack: isDev ? err.stack : null,
    showFooter: true,
  });
});

export { routerGlobal };
