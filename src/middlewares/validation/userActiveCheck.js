import { findUserByUsername } from '../../modules/login/models/userModel.js';

// Middleware para verificar que el usuario de la sesión aún existe en la base de datos
export const checkUserStillExists = async (req, res, next) => {
  // Solo verificar si hay una sesión de usuario activa
  if (!req.session.user || !req.session.user.username) {
    return next();
  }

  try {
    // Verificar si el usuario aún existe en la base de datos
    const userExists = await findUserByUsername(req.session.user.username);
    
    if (!userExists) {
      // El usuario fue eliminado, destruir la sesión y redirigir al login
      console.log(`🚨 Usuario eliminado detectado en sesión activa: ${req.session.user.username} - Cerrando sesión automáticamente`);
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Error al destruir sesión de usuario eliminado:', err);
        }
      });
      
      // Si es una petición AJAX/API, devolver JSON
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(401).json({
          success: false,
          message: 'Tu cuenta ha sido eliminada. Serás redirigido al login.',
          redirect: '/login',
          userDeleted: true
        });
      }
      
      // Si es una petición normal, redirigir al login
      return res.redirect('/login?message=account_deleted');
    }
    
    // El usuario existe, continuar normalmente
    next();
    
  } catch (error) {
    console.error('Error al verificar existencia del usuario:', error);
    // En caso de error, permitir continuar para no bloquear el sistema
    next();
  }
};

// Middleware específico para rutas de administración
export const checkAdminStillExists = async (req, res, next) => {
  // Solo verificar si hay una sesión de administrador activa
  if (!req.session.user || req.session.user.role !== 'Administrador') {
    return next();
  }

  try {
    const userExists = await findUserByUsername(req.session.user.username);
    
    if (!userExists || userExists.role !== 'Administrador') {
      console.log(`🚨 Administrador eliminado o degradado detectado: ${req.session.user.username} - Cerrando sesión`);
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Error al destruir sesión de admin eliminado:', err);
        }
      });
      
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta de administrador ha sido eliminada o modificada. Serás redirigido al login.',
          redirect: '/login',
          adminRevoked: true
        });
      }
      
      return res.redirect('/login?message=admin_revoked');
    }
    
    next();
    
  } catch (error) {
    console.error('Error al verificar existencia del administrador:', error);
    next();
  }
};
