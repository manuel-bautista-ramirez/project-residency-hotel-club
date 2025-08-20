import express from 'express';
import { roleMiddleware, authMiddleware } from '../middlewares/accessDenied.js';
import { loginUser } from '../controllers/authControllerUsers.js';

const router = express.Router();

// Login page
router.get('/', (req, res) => res.render('login', { title: 'Inicio' }));

// Handle login
router.post('/login', loginUser);

// Protected home page
router.get('/home', authMiddleware, (req, res) => {
  const user = req.session.user;
  if (!user?.username || !user?.role) return res.redirect('/');
  res.render('home', { title: 'Home', ...user });
});

// Logout
router.get('/logout', (req, res) =>
  req.session.destroy(err =>
    err
      ? res.status(500).send('Error al cerrar sesión')
      : res.redirect('/')
  )
);
// Admin panel
router.get('/admin', roleMiddleware('Administrador'), (req, res) =>
  res.render('admin', { title: 'Panel de Administración' })
);

// 404 handler
router.use((req, res) => res.status(404).render('error404', { title: 'Página no encontrada' }));

export default router;
