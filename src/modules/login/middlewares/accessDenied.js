/**
 * Middleware de autenticación para verificar si un usuario está autenticado.
 *
 * Este middleware verifica si existe un usuario en la sesión actual. Si el usuario
 * está autenticado, permite continuar con el siguiente controlador. De lo contrario,
 * responde con un estado 401 y renderiza una vista de acceso restringido.
 *
 * @param {Object} req - Objeto de solicitud HTTP (Request).
 * @param {Object} req.session - Sesión actual del usuario.
 * @param {Object} req.session.user - Información del usuario autenticado en la sesión.
 * @param {Object} res - Objeto de respuesta HTTP (Response).
 * @param {Function} next - Función para pasar el control al siguiente middleware o controlador.
 */
export const authMiddleware = (req, res, next) => {
  const isAuthenticated = req.session?.user; // Verifica si hay un usuario en la sesión
  if (isAuthenticated) {
    console.log(`Usuario autenticado: ${req.session.user.username}`);
    next(); // Continúa con el controlador si está autenticado
  } else {
    res.status(401).render('authMiddleware', {
      title: 'Acceso Restringido',
      redirectUrl: '/', // Ruta a la que se redirigirá después de 5 segundos
    });
    // console.log('Usuario no autenticado. Redirigiendo al login.');
    // res.redirect('/'); // Redirige al login si no está autenticado
  }
};

export const roleMiddleware = (requiredRole) => (req, res, next) => {
  const { role } = req.session.user || {};
  if (role !== requiredRole) {
    return res.status(403).render('error403', { title: 'Acceso denegado' });
  }
  next();
};

