import express from 'express';

import {roleMiddleware, authMiddleware} from '../middlewares/accessDenied.js';

// Importación de middlewares y controladores
import { loginUser } from '../controllers/authControllerUsers.js';

const router = express.Router();

// Renderiza la página de inicio de sesión
router.get('/', (req, res) => res.render('login', { title: 'Inicio' }));

// Maneja el inicio de sesión
router.post('/login', loginUser);

// Renderiza la página principal (home) protegida
router.get('/home', authMiddleware, (req, res) => {
  const { username, role } = req.session.user || {};
  if (!username || !role) {
    return res.redirect('/'); // Redirigir al login si no hay sesión activa
  }

  res.render('home', {
    title: 'Home',
    username,
    role, // Pasar el rol del usuario a la vista
  });
});

// Cierra la sesión y redirige al login
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al destruir la sesión:', err);
      return res.status(500).send('Error al cerrar sesión');
    }
    res.redirect('/');
  });
});

router.get('/admin', roleMiddleware('SuperUsuario'), (req, res) => {
  res.render('admin', { title: 'Panel de Administración' });
});

// Renderiza la página de error 404
router.use((req, res) => res.status(404).render('error404', { title: 'Página no encontrada' }));

export default router;
