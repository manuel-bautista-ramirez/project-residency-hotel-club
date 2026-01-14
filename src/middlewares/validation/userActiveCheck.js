import { findUserByUsername } from '../../modules/login/models/userModel.js';

// Middleware unificado para verificar la integridad de la sesión en tiempo real
export const verifySessionConsistency = async (req, res, next) => {
  // 1. Si no hay usuario en sesión, no hay nada que verificar
  if (!req.session.user || !req.session.user.username) {
    return next();
  }

  try {
    // 2. Buscar datos frescos del usuario en la Base de Datos
    const userFromDb = await findUserByUsername(req.session.user.username);

    // CASO A: El usuario ya no existe en la BD o está marcado como Inactivo
    if (!userFromDb || userFromDb.role === 'Inactivo') {
      console.log(`🚨 SEGUIDAD: Usuario eliminado o inactivado detectado en sesión activa: ${req.session.user.username}`);
      return destroySessionAndRedirect(req, res, 'account_deleted');
    }

    // CASO B: El rol en la BD es diferente al rol en la sesión (fue degradado o promovido)
    // Esto soluciona el problema: Si era 'Administrador' y ahora es 'Usuario', entra aquí.
    if (userFromDb.role !== req.session.user.role) {
      console.log(`🚨 SEGURIDAD: Cambio de privilegio detectado para ${req.session.user.username}.`);
      console.log(`   - Rol en Sesión: '${req.session.user.role}'`);
      console.log(`   - Rol en BD:     '${userFromDb.role}'`);
      console.log(`   -> Cerrando sesión por inconsistencia de permisos.`);

      return destroySessionAndRedirect(req, res, 'admin_revoked');
    }

    // Todo correcto, continuar
    next();

  } catch (error) {
    console.error('❌ Error al verificar consistencia de sesión:', error);
    // En fallo de DB, por seguridad permitimos continuar o podríamos bloquear.
    // Por disponibilidad, dejamos pasar, pero logueamos el error.
    next();
  }
};

// Función auxiliar para destruir sesión y responder con advertencia previa
const destroySessionAndRedirect = (req, res, reasonMessage) => {
  const messageMap = {
    'account_deleted': {
      title: '¡SESIÓN BLOQUEADA!',
      text: 'Esta cuenta ha sido dada de baja permanentemente. El acceso ha sido revocado de inmediato.'
    },
    'admin_revoked': {
      title: '¡SEGURIDAD: PERMISOS ALTERADOS!',
      text: 'Se han detectado cambios en tus privilegios. Por seguridad, la sesión actual ha sido destruida.'
    }
  };

  const info = messageMap[reasonMessage] || {
    title: 'Acceso Denegado',
    text: 'Tu sesión ha sido terminada por una auditoría de seguridad en tiempo real.'
  };

  // Limpiar cookies de forma agresiva
  res.clearCookie('connect.sid');

  req.session.destroy((err) => {
    if (err) console.error('Error al destruir sesión:', err);

    // 1. Si la petición es AJAX / Fetch
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(403).json({
        success: false,
        message: info.text,
        sessionTerminated: true,
        redirect: `/login`
      });
    }

    // 2. Navegación Normal: Enviamos una "Página de Puente" con la alerta
    // Esto permite que el usuario vea el mensaje ANTES de que la página cambie al Login
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <style>body { font-family: sans-serif; background: #f3f4f6; }</style>
      </head>
      <body>
          <script>
              Swal.fire({
                  icon: 'warning',
                  title: '${info.title}',
                  text: '${info.text}',
                  confirmButtonText: 'Entendido',
                  confirmButtonColor: '#3B82F6',
                  allowOutsideClick: false,
                  allowEscapeKey: false
              }).then(() => {
                  window.location.href = '/login';
              });
          </script>
      </body>
      </html>
    `);
  });
};
