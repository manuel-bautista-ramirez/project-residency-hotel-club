import express from 'express';
import { authMiddleware, roleMiddleware } from '../../../middlewares/validation/accessDenied.js';
import { validateUserId, logAdminAction } from '../middlewares/adminValidation.js';
import {
  showAdminPanel,
  showCreateUserForm,
  createUserController,
  getUserById,
  updateUserController,
  deleteUserController,
  getAllUsersController
} from '../controllers/controller.js';

const router = express.Router();

// =====================================================
// RUTAS DE VISTAS (HTML) - Solo administradores
// =====================================================

// Panel principal de administración
router.get('/admin', authMiddleware, roleMiddleware('Administrador'), showAdminPanel);

// Formulario para crear usuario (si necesitas una vista separada)
router.get('/admin/users/create', authMiddleware, roleMiddleware('Administrador'), showCreateUserForm);

// =====================================================
// RUTAS DE API (JSON) - Solo administradores
// =====================================================

// Obtener todos los usuarios
router.get('/api/admin/users',
  authMiddleware,
  roleMiddleware('Administrador'),
  logAdminAction('GET_ALL_USERS'),
  getAllUsersController
);

// Obtener usuario por ID
router.get('/api/admin/users/:id',
  authMiddleware,
  roleMiddleware('Administrador'),
  validateUserId,
  logAdminAction('GET_USER'),
  getUserById
);

// Crear nuevo usuario
router.post('/api/admin/users',
  authMiddleware,
  roleMiddleware('Administrador'),
  logAdminAction('CREATE_USER'),
  createUserController
);

// Actualizar usuario
router.put('/api/admin/users/:id',
  authMiddleware,
  roleMiddleware('Administrador'),
  validateUserId,
  logAdminAction('UPDATE_USER'),
  updateUserController
);

// Eliminar usuario
router.delete('/api/admin/users/:id',
  authMiddleware,
  roleMiddleware('Administrador'),
  validateUserId,
  logAdminAction('DELETE_USER'),
  deleteUserController
);

export { router as adminRouter };
