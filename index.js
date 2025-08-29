// Importación de dependencias
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import {app} from './src/config/app.js'
import homeRoutes from './src/modules/login/routers/homeRoutes.js'
import passwordRecoveryRoutes from './src/modules/login/routers/passwordRecoveryRoutes.js';
import {routerMember} from './src/modules/membership/routes/membershipRoutes.js';
import {routerRoom} from './src/modules/rooms/routes/RouteRooms.js';

// Configuración de variables para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para procesar datos enviados en el cuerpo de la solicitud
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de sesiones
app.use(session({
  secret: 'las_mujeres_me_dan_miedo',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}))


app.use('/password-reset', passwordRecoveryRoutes); // Prefijo único para recuperación de contraseña
app.use('/memberships', routerMember); // Prefijo único para membresías
app.use('/rooms', routerRoom); // Prefijo único para habitaciones

app.use(homeRoutes);
app.use(routerMember);
app.use(routerRoom);
app.use('/password-reset', passwordRecoveryRoutes); // Prefijo único para recuperación de contraseña

// Iniciar el servidor
app.listen(app.get('port'),() => {
  console.log(`Servidor corriendo en el puerto: http://localhost:${app.get('port')}`);
});
